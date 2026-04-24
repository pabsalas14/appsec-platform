"""EjecucionDast CRUD endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.ejecucion_dast import EjecucionDast
from app.models.user import User
from app.schemas.ejecucion_dast import EjecucionDastCreate, EjecucionDastRead, EjecucionDastUpdate
from app.services.ejecucion_dast_service import ejecucion_dast_svc

router = APIRouter()


@router.get("")
async def list_ejecucion_dasts(
    programa_dast_id: Optional[UUID] = Query(None, description="Filter by programa_dast_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List ejecuciones DAST owned by the current user, optionally filtered by programa."""
    filters: dict = {"user_id": current_user.id}
    if programa_dast_id is not None:
        filters["programa_dast_id"] = programa_dast_id
    items = await ejecucion_dast_svc.list(db, filters=filters)
    return success([EjecucionDastRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_ejecucion_dast(
    entity: EjecucionDast = Depends(require_ownership(ejecucion_dast_svc)),
):
    """Get a single owned ejecucion DAST by ID."""
    return success(EjecucionDastRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_ejecucion_dast(
    entity_in: EjecucionDastCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new ejecucion DAST for the current user."""
    entity = await ejecucion_dast_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(EjecucionDastRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_ejecucion_dast(
    entity_in: EjecucionDastUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: EjecucionDast = Depends(require_ownership(ejecucion_dast_svc)),
):
    """Partially update an owned ejecucion DAST."""
    updated = await ejecucion_dast_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(EjecucionDastRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_ejecucion_dast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: EjecucionDast = Depends(require_ownership(ejecucion_dast_svc)),
):
    """Delete an owned ejecucion DAST."""
    await ejecucion_dast_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "EjecucionDast deleted"})
