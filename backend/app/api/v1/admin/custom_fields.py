"""Admin Custom Fields endpoints — per-entity field management (FASE 4)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import NotFoundException
from app.core.logging import logger
from app.core.response import paginated, success
from app.models.custom_field import CustomField, CustomFieldValue
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
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    entity_type: str | None = Query(None),
):
    """List custom fields (paginated, optionally filtered by entity type and search)."""
    query = select(CustomField).where(CustomField.deleted_at.is_(None))
    
    if entity_type:
        query = query.where(CustomField.entity_type == entity_type)
    
    if search:
        query = query.where(CustomField.name.ilike(f"%{search}%"))
    
    # Contar total antes de offset
    total = await db.scalar(
        select(func.count()).select_from(CustomField).where(CustomField.deleted_at.is_(None))
    )
    if entity_type:
        total = await db.scalar(
            select(func.count()).select_from(CustomField)
            .where(CustomField.deleted_at.is_(None))
            .where(CustomField.entity_type == entity_type)
        )
    if search:
        total = await db.scalar(
            select(func.count()).select_from(CustomField)
            .where(CustomField.deleted_at.is_(None))
            .where(CustomField.name.ilike(f"%{search}%"))
        )
    
    skip = (page - 1) * page_size
    rows = await db.scalars(query.order_by(CustomField.order).offset(skip).limit(page_size))
    
    logger.info(
        "custom_field.list",
        extra={"page": page, "page_size": page_size, "total": total, "entity_type": entity_type},
    )
    return paginated(
        [CustomFieldRead.model_validate(r).model_dump(mode="json") for r in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("", status_code=201, response_model=dict)
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


@router.patch("/{field_id}", response_model=dict)
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


@router.delete("/{field_id}", response_model=dict)
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


@router.get("/{entity_type}/{entity_id}", response_model=dict)
async def get_custom_field_values(
    entity_type: str,
    entity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Get all custom field values for a specific entity instance."""
    # Get field definitions for this entity_type
    fields_query = select(CustomField).where(
        CustomField.entity_type == entity_type,
        CustomField.deleted_at.is_(None),
    )
    fields = await db.scalars(fields_query)
    
    # Get values
    values_query = select(CustomFieldValue).where(
        CustomFieldValue.entity_type == entity_type,
        CustomFieldValue.entity_id == entity_id,
        CustomFieldValue.deleted_at.is_(None),
    )
    values = await db.scalars(values_query)
    values_dict = {str(v.field_id): v.value for v in values}
    
    logger.info(
        "custom_field.get_values",
        extra={"entity_type": entity_type, "entity_id": str(entity_id)},
    )
    return success({
        "entity_type": entity_type,
        "entity_id": str(entity_id),
        "fields": [CustomFieldRead.model_validate(f).model_dump(mode="json") for f in fields],
        "values": values_dict,
    })


@router.patch("/{entity_type}/{entity_id}/{field_id}", response_model=dict)
async def set_custom_field_value(
    entity_type: str,
    entity_id: uuid.UUID,
    field_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Set value for a specific custom field on an entity instance."""
    # Verify field exists
    field = await custom_field_svc.get(db, field_id)
    if not field or field.entity_type != entity_type:
        raise NotFoundException("Custom field not found")
    
    # Find or create value record
    value_query = select(CustomFieldValue).where(
        CustomFieldValue.field_id == field_id,
        CustomFieldValue.entity_id == entity_id,
        CustomFieldValue.entity_type == entity_type,
        CustomFieldValue.deleted_at.is_(None),
    )
    value_record = await db.scalar(value_query)
    
    if value_record:
        value_record.value = payload.get("value")
    else:
        value_record = CustomFieldValue(
            field_id=field_id,
            entity_type=entity_type,
            entity_id=entity_id,
            value=payload.get("value"),
        )
        db.add(value_record)
    
    await db.flush()
    await audit_record(db, admin.id, "custom_field_value", "update", field_id)
    logger.info(
        "custom_field.set_value",
        extra={"field_id": str(field_id), "entity_type": entity_type, "entity_id": str(entity_id)},
    )
    return success({"field_id": str(field_id), "value": value_record.value})
