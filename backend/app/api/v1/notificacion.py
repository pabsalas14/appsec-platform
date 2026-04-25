"""Notificacion CRUD endpoints — in-app (G2)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.api.deps_ownership import require_ownership
from app.core.permissions import P
from app.core.response import success
from app.models.notificacion import Notificacion
from app.models.user import User
from app.schemas.notificacion import NotificacionCreate, NotificacionRead, NotificacionUpdate
from app.services.notificacion_service import marcar_todas_leidas_for_user, notificacion_svc

router = APIRouter()


@router.get("")
async def list_notificacions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.NOTIFICATIONS.VIEW)),
):
    """List notificacions owned by the current user (más recientes primero)."""
    items = await notificacion_svc.list(db, filters={"user_id": current_user.id})
    return success([NotificacionRead.model_validate(x).model_dump(mode="json") for x in items])


@router.post("/marcar-todas-leidas")
async def marcar_todas_leidas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.NOTIFICATIONS.EDIT)),
):
    """Marca como leídas todas las notificaciones del usuario actual."""
    n = await marcar_todas_leidas_for_user(db, current_user.id)
    return success({"marked_read": n})


@router.get("/{id}")
async def get_notificacion(
    entity: Notificacion = Depends(require_ownership(notificacion_svc)),
    _: User = Depends(require_permission(P.NOTIFICATIONS.VIEW)),
):
    """Get a single owned notificacion by ID (404 if not owned)."""
    return success(NotificacionRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_notificacion(
    entity_in: NotificacionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.NOTIFICATIONS.EDIT)),
):
    """Crea un aviso in-app propio (sistema/background puede usar en fases futuras)."""
    entity = await notificacion_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(NotificacionRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_notificacion(
    entity_in: NotificacionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.NOTIFICATIONS.EDIT)),
    entity: Notificacion = Depends(require_ownership(notificacion_svc)),
):
    """Partially update an owned notificacion (404 if not owned)."""
    updated = await notificacion_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(NotificacionRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_notificacion(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.NOTIFICATIONS.EDIT)),
    entity: Notificacion = Depends(require_ownership(notificacion_svc)),
):
    """Delete an owned notificacion (404 if not owned)."""
    await notificacion_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "Notificacion deleted"})
