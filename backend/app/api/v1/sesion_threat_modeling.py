"""SesionThreatModeling CRUD endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.sesion_threat_modeling import SesionThreatModeling
from app.models.user import User
from app.schemas.sesion_threat_modeling import (
    SesionThreatModelingCreate,
    SesionThreatModelingRead,
    SesionThreatModelingUpdate,
)
from app.services.sesion_threat_modeling_service import sesion_threat_modeling_svc

router = APIRouter()


@router.get("")
async def list_sesion_threat_modelings(
    programa_tm_id: Optional[UUID] = Query(None, description="Filter by programa_tm_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List sesiones de threat modeling, optionally filtered by programa."""
    filters: dict = {"user_id": current_user.id}
    if programa_tm_id is not None:
        filters["programa_tm_id"] = programa_tm_id
    items = await sesion_threat_modeling_svc.list(db, filters=filters)
    return success([SesionThreatModelingRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_sesion_threat_modeling(
    entity: SesionThreatModeling = Depends(require_ownership(sesion_threat_modeling_svc)),
):
    """Get a single owned sesion de threat modeling by ID."""
    return success(SesionThreatModelingRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_sesion_threat_modeling(
    entity_in: SesionThreatModelingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new sesion de threat modeling for the current user."""
    entity = await sesion_threat_modeling_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(SesionThreatModelingRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_sesion_threat_modeling(
    entity_in: SesionThreatModelingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: SesionThreatModeling = Depends(require_ownership(sesion_threat_modeling_svc)),
):
    """Partially update an owned sesion de threat modeling."""
    updated = await sesion_threat_modeling_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(SesionThreatModelingRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_sesion_threat_modeling(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: SesionThreatModeling = Depends(require_ownership(sesion_threat_modeling_svc)),
):
    """Delete an owned sesion de threat modeling."""
    await sesion_threat_modeling_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "SesionThreatModeling deleted"})
