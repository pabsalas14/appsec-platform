"""Notificacion service — async CRUD with enforced per-user ownership."""

import uuid

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notificacion import Notificacion
from app.schemas.notificacion import NotificacionCreate, NotificacionUpdate
from app.services.base import BaseService

notificacion_svc = BaseService[Notificacion, NotificacionCreate, NotificacionUpdate](
    Notificacion,
    owner_field="user_id",
    audit_action_prefix="notificacion",
)


async def marcar_todas_leidas_for_user(
    db: AsyncSession, user_id: uuid.UUID
) -> int:
    """Marca como leídas todas las notificaciones del usuario. Devuelve filas afectadas."""
    stmt = (
        update(Notificacion)
        .where(Notificacion.user_id == user_id)
        .where(Notificacion.leida.is_(False))
        .values(leida=True)
    )
    res = await db.execute(stmt)
    n = int(res.rowcount or 0)
    await db.flush()
    if n:
        await notificacion_svc._audit(
            db,
            "marcar_todas",
            None,
            override_entity_id=user_id,
            metadata={"marked_read": n},
        )
    return n
