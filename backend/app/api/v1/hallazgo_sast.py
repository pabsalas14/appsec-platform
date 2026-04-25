"""HallazgoSast CRUD endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.hallazgo_sast import HallazgoSast
from app.models.user import User
from app.schemas.hallazgo_sast import HallazgoSastCreate, HallazgoSastRead, HallazgoSastUpdate
from app.services.hallazgo_sast_service import hallazgo_sast_svc

router = APIRouter()


@router.get("")
async def list_hallazgo_sasts(
    actividad_sast_id: UUID | None = Query(None, description="Filter by actividad_sast_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List hallazgos SAST owned by the current user, optionally filtered by actividad."""
    filters: dict = {"user_id": current_user.id}
    if actividad_sast_id is not None:
        filters["actividad_sast_id"] = actividad_sast_id
    items = await hallazgo_sast_svc.list(db, filters=filters)
    return success([HallazgoSastRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_hallazgo_sast(
    entity: HallazgoSast = Depends(require_ownership(hallazgo_sast_svc)),
):
    """Get a single owned hallazgo SAST by ID."""
    return success(HallazgoSastRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_hallazgo_sast(
    entity_in: HallazgoSastCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new hallazgo SAST for the current user."""
    entity = await hallazgo_sast_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(HallazgoSastRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_hallazgo_sast(
    entity_in: HallazgoSastUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoSast = Depends(require_ownership(hallazgo_sast_svc)),
):
    """Partially update an owned hallazgo SAST."""
    updated = await hallazgo_sast_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(HallazgoSastRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_hallazgo_sast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoSast = Depends(require_ownership(hallazgo_sast_svc)),
):
    """Delete an owned hallazgo SAST."""
    await hallazgo_sast_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "HallazgoSast deleted"})
