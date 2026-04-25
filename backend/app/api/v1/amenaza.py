"""Amenaza CRUD endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.amenaza import Amenaza
from app.models.user import User
from app.schemas.amenaza import AmenazaCreate, AmenazaRead, AmenazaUpdate
from app.services.amenaza_service import amenaza_svc

router = APIRouter()


@router.get("")
async def list_amenazas(
    sesion_id: UUID | None = Query(None, description="Filter by sesion_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List amenazas owned by the current user, optionally filtered by sesion."""
    filters: dict = {"user_id": current_user.id}
    if sesion_id is not None:
        filters["sesion_id"] = sesion_id
    items = await amenaza_svc.list(db, filters=filters)
    return success([AmenazaRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_amenaza(
    entity: Amenaza = Depends(require_ownership(amenaza_svc)),
):
    """Get a single owned amenaza by ID."""
    return success(AmenazaRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_amenaza(
    entity_in: AmenazaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new amenaza for the current user. score_total is auto-calculated."""
    entity = await amenaza_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(AmenazaRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_amenaza(
    entity_in: AmenazaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: Amenaza = Depends(require_ownership(amenaza_svc)),
):
    """Partially update an owned amenaza. score_total is recalculated automatically."""
    updated = await amenaza_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(AmenazaRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_amenaza(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: Amenaza = Depends(require_ownership(amenaza_svc)),
):
    """Delete an owned amenaza."""
    await amenaza_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "Amenaza deleted"})
