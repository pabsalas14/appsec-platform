"""ActualizacionIniciativa CRUD endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.user import User
from app.models.actualizacion_iniciativa import ActualizacionIniciativa
from app.schemas.actualizacion_iniciativa import ActualizacionIniciativaCreate, ActualizacionIniciativaRead, ActualizacionIniciativaUpdate
from app.services.actualizacion_iniciativa_service import actualizacion_iniciativa_svc

router = APIRouter()


@router.get("")
async def list_actualizacion_iniciativas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List actualizacion iniciativas owned by the current user."""
    items = await actualizacion_iniciativa_svc.list(db, filters={"user_id": current_user.id})
    return success([ActualizacionIniciativaRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_actualizacion_iniciativa(
    entity: ActualizacionIniciativa = Depends(require_ownership(actualizacion_iniciativa_svc)),
):
    """Get a single owned actualizacion iniciativa by ID (404 if not owned)."""
    return success(ActualizacionIniciativaRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_actualizacion_iniciativa(
    entity_in: ActualizacionIniciativaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new actualizacion iniciativa for the current user."""
    entity = await actualizacion_iniciativa_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(ActualizacionIniciativaRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_actualizacion_iniciativa(
    entity_in: ActualizacionIniciativaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ActualizacionIniciativa = Depends(require_ownership(actualizacion_iniciativa_svc)),
):
    """Partially update an owned actualizacion iniciativa (404 if not owned)."""
    updated = await actualizacion_iniciativa_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(ActualizacionIniciativaRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_actualizacion_iniciativa(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ActualizacionIniciativa = Depends(require_ownership(actualizacion_iniciativa_svc)),
):
    """Delete an owned actualizacion iniciativa (404 if not owned)."""
    await actualizacion_iniciativa_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "ActualizacionIniciativa deleted"})
