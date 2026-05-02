"""Reglas de Kanban / move para ServiceRelease (spec liberaciones §5 — gate a producción)."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException
from app.models.excepcion_vulnerabilidad import ExcepcionVulnerabilidad
from app.models.vulnerabilidad import Vulnerabilidad

# Estados destino que implican despliegue / cierre de seguridad tipo “aprobado a prod”.
PRODUCTION_GATE_STATES = frozenset({"En Produccion"})


async def validate_move_high_risk_state(
    db: AsyncSession,
    *,
    servicio_id: UUID,
    target_column: str,
) -> None:
    """
    Impide mover a Producción si el servicio tiene hallazgos Crítica/Alta activos (≠ Cerrada)
    sin una excepción **Aprobada** y **no vencida**.
    """
    if target_column not in PRODUCTION_GATE_STATES:
        return

    now = datetime.now(UTC)

    res = await db.execute(
        select(Vulnerabilidad.id).where(
            Vulnerabilidad.servicio_id == servicio_id,
            Vulnerabilidad.deleted_at.is_(None),
            Vulnerabilidad.estado != "Cerrada",
            func.lower(Vulnerabilidad.severidad).in_(["critica", "alta"]),
        )
    )
    vuln_ids = [row[0] for row in res.all()]
    if not vuln_ids:
        return

    for vid in vuln_ids:
        cnt = (
            await db.execute(
                select(func.count())
                .select_from(ExcepcionVulnerabilidad)
                .where(
                    ExcepcionVulnerabilidad.vulnerabilidad_id == vid,
                    ExcepcionVulnerabilidad.estado == "Aprobada",
                    ExcepcionVulnerabilidad.fecha_limite >= now,
                    ExcepcionVulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        if not cnt:
            raise BadRequestException(
                detail=(
                    "No se puede pasar a Producción: hay vulnerabilidades Críticas o Altas activas "
                    "para este servicio sin excepción aprobada vigente. Remedia, cierra el hallazgo "
                    "o gestiona una excepción aprobada."
                )
            )
