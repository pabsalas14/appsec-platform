"""Evaluación de indicadores por código BRD (E1) — cálculo, tendencia, agregado."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.response import success
from app.models.indicador_formula import IndicadorFormula
from app.models.user import User
from app.services.indicator_evaluator import IndicatorEvaluationError, evaluate_formula, status_for_value

router = APIRouter()


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
        from app.core.exceptions import ValidationException

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
        7, ge=1, le=30, description="Días hacia atrás; serie v1 = mismo valor (evolución detallada en backlog)."
    ),
):
    """
    E1.3 / F1: serie de puntos para gráficos. v1: repite el valor actual (sin serie histórica materializada).
    """
    row = await _get_formula_for_user(db, code=code, user_id=current_user.id)
    try:
        value = float(await evaluate_formula(db, row.formula, user_id=current_user.id))
    except IndicatorEvaluationError as e:
        from app.core.exceptions import ValidationException

        raise ValidationException(str(e)) from e
    points = [{"day_offset": d, "value": value} for d in range(days)]
    return success({"code": row.code, "trend_7d": points})


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
        from app.core.exceptions import ValidationException

        raise ValidationException(str(e)) from e
    return success(
        {
            "code": row.code,
            "value": value,
            "include_formulas": [row.code],
            "by_hierarchy": [],
        }
    )
