"""Evaluación de indicadores por código BRD (E1) — cálculo, tendencia, agregado."""

from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import ValidationException
from app.core.response import success
from app.models.indicador_formula import IndicadorFormula
from app.models.indicador_valor_manual import IndicadorValorManual
from app.models.user import User
from app.schemas.indicador_manual import IndicadorManualOut, IndicadorManualUpsert
from app.services.indicator_evaluator import IndicatorEvaluationError, evaluate_formula, status_for_value

router = APIRouter()


def _months_chronological(n: int) -> list[str]:
    """Últimos ``n`` meses en orden cronológico (más antiguo → más reciente)."""
    now = datetime.now(UTC)
    y, m = now.year, now.month
    tail: list[str] = []
    for _ in range(n):
        tail.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return list(reversed(tail))


def _valid_periodo(periodo: str) -> bool:
    return bool(re.fullmatch(r"\d{4}-\d{2}", periodo))


async def _get_formula_for_user(db: AsyncSession, *, code: str, user_id) -> IndicadorFormula:
    result = await db.execute(
        select(IndicadorFormula).where(
            IndicadorFormula.code == code,
            IndicadorFormula.user_id == user_id,
            IndicadorFormula.deleted_at.is_(None),
        )
    )
    row = result.scalar_one_or_none()
    if row is None:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Indicador no encontrado")
    return row


@router.get("/{code}/calculate")
async def calculate_indicador_by_code(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calcula el valor actual de un `IndicadorFormula` por `code` para el usuario actual.
    """
    row = await _get_formula_for_user(db, code=code, user_id=current_user.id)
    try:
        value = await evaluate_formula(db, row.formula, user_id=current_user.id)
    except IndicatorEvaluationError as e:
        raise ValidationException(str(e)) from e

    sem = (row.formula or {}) if isinstance(row.formula, dict) else {}
    higher = bool((sem.get("semantics") or {}).get("higher_is_better"))
    status = status_for_value(
        value,
        threshold_green=row.threshold_green,
        threshold_yellow=row.threshold_yellow,
        threshold_red=row.threshold_red,
        lower_is_better=not higher,
    )
    return success(
        {
            "code": row.code,
            "nombre": row.nombre,
            "value": value,
            "status": status,
            "threshold_green": row.threshold_green,
            "threshold_yellow": row.threshold_yellow,
            "threshold_red": row.threshold_red,
        }
    )


@router.get("/{code}/trend")
async def trend_indicador(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(
        7, ge=1, le=30, description="Días hacia atrás (si no se usa months)."
    ),
    months: int | None = Query(
        None,
        ge=1,
        le=36,
        description="Meses hacia atrás (YYYY-MM). Mezcla capturas manuales y valor calculado actual.",
    ),
):
    """
    E1.3 / F1: serie para gráficos.
    - Si ``months`` está definido: últimos N meses; valor manual si existe, si no el calculado hoy.
    - Si no: compatibilidad v1 por días (mismo valor).
    """
    row = await _get_formula_for_user(db, code=code, user_id=current_user.id)
    try:
        computed = float(await evaluate_formula(db, row.formula, user_id=current_user.id))
    except IndicatorEvaluationError as e:
        raise ValidationException(str(e)) from e

    if months is not None:
        period_keys = _months_chronological(months)
        if not period_keys:
            return success({"code": row.code, "series": []})
        mr = await db.execute(
            select(IndicadorValorManual).where(
                IndicadorValorManual.user_id == current_user.id,
                IndicadorValorManual.code == code,
                IndicadorValorManual.periodo.in_(period_keys),
            )
        )
        by_p = {m.periodo: float(m.valor) for m in mr.scalars().all()}
        series = [
            {
                "period": p,
                "value": by_p.get(p, computed),
                "manual": p in by_p,
            }
            for p in period_keys
        ]
        return success({"code": row.code, "series": series})

    points = [{"day_offset": d, "value": computed} for d in range(days)]
    return success({"code": row.code, "trend_7d": points})


@router.get("/{code}/manual", response_model=None)
async def list_indicador_manual(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_formula_for_user(db, code=code, user_id=current_user.id)
    r = await db.execute(
        select(IndicadorValorManual)
        .where(
            IndicadorValorManual.user_id == current_user.id,
            IndicadorValorManual.code == code,
        )
        .order_by(IndicadorValorManual.periodo.asc())
    )
    rows = r.scalars().all()
    return success([IndicadorManualOut.model_validate(x).model_dump() for x in rows])


@router.put("/{code}/manual/{periodo}")
async def upsert_indicador_manual(
    code: str,
    periodo: str,
    body: IndicadorManualUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _valid_periodo(periodo):
        raise ValidationException("periodo debe ser YYYY-MM")
    await _get_formula_for_user(db, code=code, user_id=current_user.id)
    now = datetime.now(UTC)
    await db.execute(
        pg_insert(IndicadorValorManual)
        .values(
            id=uuid.uuid4(),
            user_id=current_user.id,
            code=code,
            periodo=periodo,
            valor=body.valor,
            notas=body.notas,
            created_at=now,
            updated_at=now,
        )
        .on_conflict_do_update(
            index_elements=["user_id", "code", "periodo"],
            set_={
                "valor": body.valor,
                "notas": body.notas,
                "updated_at": now,
            },
        )
    )
    await db.flush()
    r = await db.execute(
        select(IndicadorValorManual).where(
            IndicadorValorManual.user_id == current_user.id,
            IndicadorValorManual.code == code,
            IndicadorValorManual.periodo == periodo,
        )
    )
    saved = r.scalar_one()
    return success(IndicadorManualOut.model_validate(saved).model_dump())


@router.get("/{code}/aggregate")
async def aggregate_indicador(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    E1.3: valor actual + sección reservada para desglose jerárquico (roll-up = backlog).
    """
    row = await _get_formula_for_user(db, code=code, user_id=current_user.id)
    try:
        value = float(await evaluate_formula(db, row.formula, user_id=current_user.id))
    except IndicatorEvaluationError as e:
        raise ValidationException(str(e)) from e
    return success(
        {
            "code": row.code,
            "value": value,
            "include_formulas": [row.code],
            "by_hierarchy": [],
        }
    )
