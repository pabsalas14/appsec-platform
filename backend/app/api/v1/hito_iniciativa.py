"""HitoIniciativa CRUD endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.hito_iniciativa import HitoIniciativa
from app.models.user import User
from app.schemas.hito_iniciativa import HitoIniciativaCreate, HitoIniciativaRead, HitoIniciativaUpdate
from app.services.hito_iniciativa_service import hito_iniciativa_svc

router = APIRouter()


@router.get("")
async def list_hito_iniciativas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List hito iniciativas owned by the current user."""
    items = await hito_iniciativa_svc.list(db, filters={"user_id": current_user.id})
    return success([HitoIniciativaRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_hito_iniciativa(
    entity: HitoIniciativa = Depends(require_ownership(hito_iniciativa_svc)),
):
    """Get a single owned hito iniciativa by ID (404 if not owned)."""
    return success(HitoIniciativaRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_hito_iniciativa(
    entity_in: HitoIniciativaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new hito iniciativa for the current user."""
    entity = await hito_iniciativa_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(HitoIniciativaRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_hito_iniciativa(
    entity_in: HitoIniciativaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HitoIniciativa = Depends(require_ownership(hito_iniciativa_svc)),
):
    """Partially update an owned hito iniciativa (404 if not owned)."""
    updated = await hito_iniciativa_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(HitoIniciativaRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_hito_iniciativa(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HitoIniciativa = Depends(require_ownership(hito_iniciativa_svc)),
):
    """Delete an owned hito iniciativa (404 if not owned)."""
    await hito_iniciativa_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "HitoIniciativa deleted"})
