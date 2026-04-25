"""FlujoEstatus CRUD endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.flujo_estatus import FlujoEstatus
from app.models.user import User
from app.schemas.flujo_estatus import FlujoEstatusCreate, FlujoEstatusRead, FlujoEstatusUpdate
from app.services.flujo_estatus_service import flujo_estatus_svc

router = APIRouter()


@router.get("")
async def list_flujos_estatus(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List flujo estatus owned by the current user."""
    items = await flujo_estatus_svc.list(db, filters={"user_id": current_user.id})
    return success([FlujoEstatusRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_flujo_estatus(
    entity: FlujoEstatus = Depends(require_ownership(flujo_estatus_svc)),
):
    """Get a single owned flujo estatus by ID (404 if not owned)."""
    return success(FlujoEstatusRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_flujo_estatus(
    entity_in: FlujoEstatusCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new flujo estatus for the current user."""
    entity = await flujo_estatus_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(FlujoEstatusRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_flujo_estatus(
    entity_in: FlujoEstatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: FlujoEstatus = Depends(require_ownership(flujo_estatus_svc)),
):
    """Partially update an owned flujo estatus (404 if not owned)."""
    updated = await flujo_estatus_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(FlujoEstatusRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_flujo_estatus(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: FlujoEstatus = Depends(require_ownership(flujo_estatus_svc)),
):
    """Delete an owned flujo estatus (404 if not owned)."""
    await flujo_estatus_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "FlujoEstatus deleted"})
