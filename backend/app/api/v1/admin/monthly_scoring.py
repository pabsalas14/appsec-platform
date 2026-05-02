"""Administración — ejecución del motor de scoring mensual (spec 12)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.logging import logger
from app.core.response import success
from app.models.historico_scoring_mensual import HistoricoScoringMensual
from app.models.user import User
from app.services.scoring_engine import run_monthly_scoring

router = APIRouter()


class EjecutarScoringBody(BaseModel):
    anio: int = Field(ge=2000, le=2100)
    mes: int = Field(ge=1, le=12)


@router.post("/ejecutar")
async def ejecutar_scoring_mensual(
    body: EjecutarScoringBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Calcula y persiste snapshots por célula y rollup jerárquico para el periodo indicado."""
    result = await run_monthly_scoring(db, user_id=current_user.id, anio=body.anio, mes=body.mes)
    logger.info(
        "admin.scoring_mensual.ejecutado",
        extra={
            "event": "admin.scoring_mensual.ejecutado",
            "user_id": str(current_user.id),
            "anio": body.anio,
            "mes": body.mes,
            "celulas": result.get("celulas_computadas"),
        },
    )
    return success(result)


@router.get("/historico")
async def list_historico_scoring(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
    anio: int | None = Query(None, ge=2000, le=2100),
    mes: int | None = Query(None, ge=1, le=12),
    scope_kind: str | None = Query(None),
) -> dict[str, Any]:
    """Lista snapshots de scoring del usuario actual."""
    stmt = select(HistoricoScoringMensual).where(HistoricoScoringMensual.user_id == current_user.id)
    if anio is not None:
        stmt = stmt.where(HistoricoScoringMensual.anio == anio)
    if mes is not None:
        stmt = stmt.where(HistoricoScoringMensual.mes == mes)
    if scope_kind:
        stmt = stmt.where(HistoricoScoringMensual.scope_kind == scope_kind)
    stmt = stmt.order_by(
        HistoricoScoringMensual.anio.desc(),
        HistoricoScoringMensual.mes.desc(),
        HistoricoScoringMensual.scope_kind,
    )
    rows = (await db.execute(stmt)).scalars().all()
    data = [
        {
            "id": str(r.id),
            "anio": r.anio,
            "mes": r.mes,
            "scope_kind": r.scope_kind,
            "scope_id": str(r.scope_id),
            "score_total": r.score_total,
            "score_vulnerabilidades": r.score_vulnerabilidades,
            "score_programas": r.score_programas,
            "score_iniciativas": r.score_iniciativas,
            "score_okrs": r.score_okrs,
            "pesos_json": r.pesos_json,
            "computed_at": r.computed_at.isoformat() if r.computed_at else None,
        }
        for r in rows
    ]
    return success(data)
