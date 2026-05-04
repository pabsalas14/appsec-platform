"""Validación runtime de transiciones usando `FlujoEstatus` (Fase 14).

Si el usuario tiene al menos una regla `FlujoEstatus` para un `entity_type`,
las transiciones de ese tipo deben coincidir con una regla explícita
`from_status` → `to_status` con `allowed=True`. Si no hay reglas, no se aplica
esta capa (el módulo sigue su validación previa, p. ej. catálogo D1).
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationException
from app.models.flujo_estatus import FlujoEstatus


async def assert_flujo_estatus_db_transition(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    entity_type: str,
    from_status: str,
    to_status: str,
) -> None:
    if from_status == to_status:
        return
    q = select(FlujoEstatus).where(
        FlujoEstatus.user_id == user_id,
        FlujoEstatus.entity_type == entity_type,
        FlujoEstatus.deleted_at.is_(None),
    )
    rows = list((await db.execute(q)).scalars().all())
    if not rows:
        return
    matching = [r for r in rows if r.from_status == from_status and r.to_status == to_status]
    if not matching:
        raise ValidationException(
            f"No hay regla de flujo configurada para la transición '{from_status}' → '{to_status}' "
            f"({entity_type}). Añádela en Flujos de estatus / Status flow."
        )
    if not any(r.allowed for r in matching):
        raise ValidationException(
            f"La transición '{from_status}' → '{to_status}' está deshabilitada en el flujo configurado."
        )
