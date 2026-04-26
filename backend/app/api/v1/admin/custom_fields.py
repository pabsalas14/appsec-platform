"""Admin Custom Fields endpoints — per-entity field management."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import NotFoundException
from app.core.logging import logger
from app.core.response import paginated, success
from app.models.custom_field import CustomField
from app.models.user import User
from app.schemas.custom_field import (
    CustomFieldCreate,
    CustomFieldList,
    CustomFieldRead,
    CustomFieldUpdate,
)
from app.services.audit_service import record as audit_record
from app.services.custom_field_service import custom_field_svc

router = APIRouter()


@router.get("", response_model=CustomFieldList)
async def list_fields(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    entity_type: str | None = Query(None),
):
    """List custom fields (paginated, optionally filtered by entity type and search)."""
    query = select(CustomField).where(CustomField.deleted_at.is_(None))
    
    if entity_type:
        query = query.where(CustomField.entity_type == entity_type)
    
    if search:
        query = query.where(CustomField.nombre.ilike(f"%{search}%"))
    
    rows = await db.scalars(query.offset(skip).limit(limit))
    total = await db.scalar(
        select(func.count()).select_from(CustomField).where(CustomField.deleted_at.is_(None))
    )
    
    logger.info(
        "custom_field.list",
        extra={"skip": skip, "limit": limit, "total": total, "entity_type": entity_type},
    )
    return paginated(
        [CustomFieldRead.model_validate(r).model_dump(mode="json") for r in rows],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("", status_code=201)
async def create_field(
    payload: CustomFieldCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Create a new custom field."""
    field = await custom_field_svc.create(db, payload)
    await audit_record(db, admin.id, "custom_field", "create", field.id)
    logger.info("custom_field.create", extra={"field_id": str(field.id)})
    return success(CustomFieldRead.model_validate(field).model_dump(mode="json"))


@router.put("/{field_id}")
async def update_field(
    field_id: uuid.UUID,
    payload: CustomFieldUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Update a custom field by ID."""
    field = await custom_field_svc.get(db, field_id)
    if not field:
        raise NotFoundException("Custom field not found")
    
    field = await custom_field_svc.update(db, field_id, payload)
    await audit_record(db, admin.id, "custom_field", "update", field.id)
    logger.info("custom_field.update", extra={"field_id": str(field.id)})
    return success(CustomFieldRead.model_validate(field).model_dump(mode="json"))


@router.delete("/{field_id}")
async def delete_field(
    field_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Soft-delete a custom field by ID."""
    field = await custom_field_svc.get(db, field_id)
    if not field:
        raise NotFoundException("Custom field not found")
    
    await custom_field_svc.delete(db, field_id, deleted_by=admin.id)
    await audit_record(db, admin.id, "custom_field", "delete", field_id)
    logger.info("custom_field.delete", extra={"field_id": str(field_id)})
    return success({"deleted": True})
