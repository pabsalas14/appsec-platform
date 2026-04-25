"""P11 — cierre automático de auditoría cuando todos los hallazgos requeridos están completos."""

from __future__ import annotations

import uuid

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auditoria import Auditoria
from app.models.hallazgo_auditoria import HallazgoAuditoria

# Requerimientos = hallazgos vinculados; «completado» si el estatus indica cierre/entrega
_ESTADOS_CUMPLIDOS = frozenset(
    {
        "Completado",
        "Cerrado",
        "Remediado",
        "Cumplido",
        "Aceptado",
    }
)


async def try_autocerrar_auditoria(
    db: AsyncSession,
    *,
    auditoria_id: uuid.UUID,
) -> bool:
    """
    Si hay al menos un hallazgo y todos están en estatus de cumplimiento,
    asigna ``Auditoria.estado = "Completada"`` (idempotente si ya lo está).
    """
    a = await db.get(Auditoria, auditoria_id)
    if a is None or a.deleted_at is not None:
        return False

    qn = select(HallazgoAuditoria).where(
        and_(
            HallazgoAuditoria.auditoria_id == auditoria_id,
            HallazgoAuditoria.deleted_at.is_(None),
        )
    )
    items = list((await db.execute(qn)).scalars().all())
    if not items:
        return False
    for h in items:
        if (h.estado or "").strip() not in _ESTADOS_CUMPLIDOS:
            return False
    if (a.estado or "").strip() in {"Completada", "Cerrada", "Cerrado"}:
        return False
    a.estado = "Completada"
    await db.flush()
    return True
