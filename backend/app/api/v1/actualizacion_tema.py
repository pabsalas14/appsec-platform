"""ActualizacionTema CRUD endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.actualizacion_tema import ActualizacionTema
from app.models.user import User
from app.schemas.actualizacion_tema import ActualizacionTemaCreate, ActualizacionTemaRead, ActualizacionTemaUpdate
from app.services.actualizacion_tema_service import actualizacion_tema_svc

router = APIRouter()


@router.get("")
async def list_actualizacion_temas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List actualizacion temas owned by the current user."""
    items = await actualizacion_tema_svc.list(db, filters={"user_id": current_user.id})
    return success([ActualizacionTemaRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_actualizacion_tema(
    entity: ActualizacionTema = Depends(require_ownership(actualizacion_tema_svc)),
):
    """Get a single owned actualizacion tema by ID (404 if not owned)."""
    return success(ActualizacionTemaRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_actualizacion_tema(
    entity_in: ActualizacionTemaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new actualizacion tema for the current user."""
    entity = await actualizacion_tema_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(ActualizacionTemaRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_actualizacion_tema(
    entity_in: ActualizacionTemaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ActualizacionTema = Depends(require_ownership(actualizacion_tema_svc)),
):
    """Partially update an owned actualizacion tema (404 if not owned)."""
    updated = await actualizacion_tema_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(ActualizacionTemaRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_actualizacion_tema(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ActualizacionTema = Depends(require_ownership(actualizacion_tema_svc)),
):
    """Delete an owned actualizacion tema (404 if not owned)."""
    await actualizacion_tema_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "ActualizacionTema deleted"})
