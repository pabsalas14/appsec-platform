"""ControlMitigacion CRUD endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.control_mitigacion import ControlMitigacion
from app.models.user import User
from app.schemas.control_mitigacion import (
    ControlMitigacionCreate,
    ControlMitigacionRead,
    ControlMitigacionUpdate,
)
from app.services.control_mitigacion_service import control_mitigacion_svc

router = APIRouter()


@router.get("")
async def list_control_mitigacions(
    amenaza_id: Optional[UUID] = Query(None, description="Filter by amenaza_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List controles de mitigación, optionally filtered by amenaza."""
    filters: dict = {"user_id": current_user.id}
    if amenaza_id is not None:
        filters["amenaza_id"] = amenaza_id
    items = await control_mitigacion_svc.list(db, filters=filters)
    return success([ControlMitigacionRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_control_mitigacion(
    entity: ControlMitigacion = Depends(require_ownership(control_mitigacion_svc)),
):
    """Get a single owned control de mitigación by ID."""
    return success(ControlMitigacionRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_control_mitigacion(
    entity_in: ControlMitigacionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new control de mitigación for the current user."""
    entity = await control_mitigacion_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(ControlMitigacionRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_control_mitigacion(
    entity_in: ControlMitigacionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ControlMitigacion = Depends(require_ownership(control_mitigacion_svc)),
):
    """Partially update an owned control de mitigación."""
    updated = await control_mitigacion_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(ControlMitigacionRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_control_mitigacion(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ControlMitigacion = Depends(require_ownership(control_mitigacion_svc)),
):
    """Delete an owned control de mitigación."""
    await control_mitigacion_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "ControlMitigacion deleted"})
