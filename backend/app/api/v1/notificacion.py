"""Notificacion CRUD endpoints — in-app (G2)."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_backoffice, require_permission
from app.api.deps_ownership import require_ownership
from app.core.permissions import P
from app.core.response import success
from app.models.notificacion import Notificacion
from app.models.user import User
from app.schemas.notification_preferences import (
    NotificationPreferencesPatch,
    merge_prefs_patch,
    read_prefs_from_user,
)
from app.schemas.notificacion import NotificacionCreate, NotificacionRead, NotificacionUpdate
from app.services.notificacion_service import marcar_todas_leidas_for_user, notificacion_svc
from app.services.notification_rules_runner import run_all_notification_rules

router = APIRouter()


@router.get("/preferences/me")
async def get_notification_preferences_me(current_user: User = Depends(get_current_user)):
    return success(read_prefs_from_user(current_user.preferences).model_dump())


@router.patch("/preferences/me")
async def patch_notification_preferences_me(
    body: NotificationPreferencesPatch,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = await db.execute(select(User).where(User.id == current_user.id))
    u = row.scalar_one()
    u.preferences = merge_prefs_patch(u.preferences if isinstance(u.preferences, dict) else None, body)
    await db.flush()
    return success(read_prefs_from_user(u.preferences).model_dump())


@router.get("")
async def list_notificacions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.NOTIFICATIONS.VIEW)),
):
    """List notificacions owned by the current user (más recientes primero)."""
    items = await notificacion_svc.list(db, filters={"user_id": current_user.id})
    return success([NotificacionRead.model_validate(x).model_dump(mode="json") for x in items])


@router.post("/procesar-reglas", status_code=200)
async def procesar_reglas_notificacion(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_backoffice),
):
    """G2 — Ejecuta reglas automáticas (§14.3); idempotente. Admin / super_admin."""
    out = await run_all_notification_rules(db)
    return success(out)


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
    updated = await notificacion_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
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
