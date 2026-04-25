"""HallazgoMAST CRUD endpoints — MAST findings (Módulo 4)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.hallazgo_mast import HallazgoMAST
from app.models.user import User
from app.schemas.hallazgo_mast import HallazgoMASTCreate, HallazgoMASTRead, HallazgoMASTUpdate
from app.services.hallazgo_mast_service import hallazgo_mast_svc

router = APIRouter()


@router.get("")
async def list_hallazgo_masts(
    ejecucion_mast_id: UUID | None = Query(None, description="Filter by ejecucion_mast_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List hallazgos MAST owned by the current user, optionally filtered by ejecución."""
    filters: dict = {"user_id": current_user.id}
    if ejecucion_mast_id is not None:
        filters["ejecucion_mast_id"] = ejecucion_mast_id
    items = await hallazgo_mast_svc.list(db, filters=filters)
    return success([HallazgoMASTRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_hallazgo_mast(
    entity: HallazgoMAST = Depends(require_ownership(hallazgo_mast_svc)),
):
    """Get a single owned hallazgo_mast by ID (404 if not owned)."""
    return success(HallazgoMASTRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_hallazgo_mast(
    entity_in: HallazgoMASTCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new hallazgo_mast for the current user."""
    entity = await hallazgo_mast_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(HallazgoMASTRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_hallazgo_mast(
    entity_in: HallazgoMASTUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoMAST = Depends(require_ownership(hallazgo_mast_svc)),
):
    """Partially update an owned hallazgo_mast (404 if not owned)."""
    updated = await hallazgo_mast_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(HallazgoMASTRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_hallazgo_mast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoMAST = Depends(require_ownership(hallazgo_mast_svc)),
):
    """Delete an owned hallazgo_mast (404 if not owned)."""
    await hallazgo_mast_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "HallazgoMAST deleted"})
