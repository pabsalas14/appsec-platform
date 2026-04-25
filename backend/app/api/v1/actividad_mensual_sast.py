"""ActividadMensualSast CRUD endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.exceptions import NotFoundException
from app.core.response import success
from app.models.actividad_mensual_sast import ActividadMensualSast
from app.models.user import User
from app.schemas.actividad_mensual_sast import (
    ActividadMensualSastCreate,
    ActividadMensualSastRead,
    ActividadMensualSastUpdate,
)
from app.services.actividad_mensual_sast_service import actividad_mensual_sast_svc

router = APIRouter()


@router.post("/{id}/sincronizar-hallazgos")
async def sincronizar_hallazgos_actividad_mensual_sast(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """B2: recalcula conteos desde `hallazgo_sasts` vinculados y el score (BRD)."""
    updated = await actividad_mensual_sast_svc.sincronizar_hallazgos(
        db, id, scope={"user_id": current_user.id}
    )
    if not updated:
        raise NotFoundException("ActividadMensualSast not found")
    return success(ActividadMensualSastRead.model_validate(updated).model_dump(mode="json"))


@router.get("")
async def list_actividad_mensual_sasts(
    programa_sast_id: UUID | None = Query(None, description="Filter by programa_sast_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List actividades mensual SAST owned by the current user, optionally filtered by programa."""
    filters: dict = {"user_id": current_user.id}
    if programa_sast_id is not None:
        filters["programa_sast_id"] = programa_sast_id
    items = await actividad_mensual_sast_svc.list(db, filters=filters)
    return success([ActividadMensualSastRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_actividad_mensual_sast(
    entity: ActividadMensualSast = Depends(require_ownership(actividad_mensual_sast_svc)),
):
    """Get a single owned actividad mensual SAST by ID."""
    return success(ActividadMensualSastRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_actividad_mensual_sast(
    entity_in: ActividadMensualSastCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new actividad mensual SAST for the current user."""
    entity = await actividad_mensual_sast_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(ActividadMensualSastRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_actividad_mensual_sast(
    entity_in: ActividadMensualSastUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ActividadMensualSast = Depends(require_ownership(actividad_mensual_sast_svc)),
):
    """Partially update an owned actividad mensual SAST."""
    updated = await actividad_mensual_sast_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(ActividadMensualSastRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_actividad_mensual_sast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ActividadMensualSast = Depends(require_ownership(actividad_mensual_sast_svc)),
):
    """Delete an owned actividad mensual SAST."""
    await actividad_mensual_sast_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "ActividadMensualSast deleted"})
