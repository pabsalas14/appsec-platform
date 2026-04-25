"""HallazgoDast CRUD endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.hallazgo_dast import HallazgoDast
from app.models.user import User
from app.schemas.hallazgo_dast import HallazgoDastCreate, HallazgoDastRead, HallazgoDastUpdate
from app.services.hallazgo_dast_service import hallazgo_dast_svc

router = APIRouter()


@router.get("")
async def list_hallazgo_dasts(
    ejecucion_dast_id: UUID | None = Query(None, description="Filter by ejecucion_dast_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List hallazgos DAST owned by the current user, optionally filtered by ejecucion."""
    filters: dict = {"user_id": current_user.id}
    if ejecucion_dast_id is not None:
        filters["ejecucion_dast_id"] = ejecucion_dast_id
    items = await hallazgo_dast_svc.list(db, filters=filters)
    return success([HallazgoDastRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_hallazgo_dast(
    entity: HallazgoDast = Depends(require_ownership(hallazgo_dast_svc)),
):
    """Get a single owned hallazgo DAST by ID."""
    return success(HallazgoDastRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_hallazgo_dast(
    entity_in: HallazgoDastCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new hallazgo DAST for the current user."""
    entity = await hallazgo_dast_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(HallazgoDastRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_hallazgo_dast(
    entity_in: HallazgoDastUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoDast = Depends(require_ownership(hallazgo_dast_svc)),
):
    """Partially update an owned hallazgo DAST."""
    updated = await hallazgo_dast_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(HallazgoDastRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_hallazgo_dast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoDast = Depends(require_ownership(hallazgo_dast_svc)),
):
    """Delete an owned hallazgo DAST."""
    await hallazgo_dast_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "HallazgoDast deleted"})
