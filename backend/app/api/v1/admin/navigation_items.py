"""Admin Navigation Items endpoints — app navigation tree management."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import NotFoundException
from app.core.logging import logger
from app.core.response import paginated, success
from app.models.navigation_item import NavigationItem
from app.models.user import User
from app.schemas.navigation_item import (
    NavigationItemCreate,
    NavigationItemList,
    NavigationItemRead,
    NavigationItemUpdate,
)
from app.services.audit_service import record as audit_record
from app.services.navigation_item_service import navigation_item_svc

router = APIRouter()


@router.get("", response_model=NavigationItemList)
async def list_items(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
):
    """List navigation items (paginated, ordered)."""
    query = select(NavigationItem).where(NavigationItem.deleted_at.is_(None))
    
    if search:
        query = query.where(NavigationItem.label.ilike(f"%{search}%"))
    
    query = query.order_by(NavigationItem.orden)
    
    rows = await db.scalars(query.offset(skip).limit(limit))
    total = await db.scalar(
        select(func.count()).select_from(NavigationItem).where(NavigationItem.deleted_at.is_(None))
    )
    
    logger.info("navigation_item.list", extra={"skip": skip, "limit": limit, "total": total})
    return paginated(
        [NavigationItemRead.model_validate(r).model_dump(mode="json") for r in rows],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("", status_code=201)
async def create_item(
    payload: NavigationItemCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Create a new navigation item."""
    item = await navigation_item_svc.create(db, payload)
    await audit_record(db, admin.id, "navigation_item", "create", item.id)
    logger.info("navigation_item.create", extra={"item_id": str(item.id)})
    return success(NavigationItemRead.model_validate(item).model_dump(mode="json"))


@router.put("/{item_id}")
async def update_item(
    item_id: uuid.UUID,
    payload: NavigationItemUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Update a navigation item by ID."""
    item = await navigation_item_svc.get(db, item_id)
    if not item:
        raise NotFoundException("Navigation item not found")
    
    item = await navigation_item_svc.update(db, item_id, payload)
    await audit_record(db, admin.id, "navigation_item", "update", item.id)
    logger.info("navigation_item.update", extra={"item_id": str(item.id)})
    return success(NavigationItemRead.model_validate(item).model_dump(mode="json"))


@router.delete("/{item_id}")
async def delete_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Soft-delete a navigation item by ID."""
    item = await navigation_item_svc.get(db, item_id)
    if not item:
        raise NotFoundException("Navigation item not found")
    
    await navigation_item_svc.delete(db, item_id, deleted_by=admin.id)
    await audit_record(db, admin.id, "navigation_item", "delete", item_id)
    logger.info("navigation_item.delete", extra={"item_id": str(item_id)})
    return success({"deleted": True})


@router.patch("/{item_id}/reorder")
async def reorder_item(
    item_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Reorder a navigation item."""
    item = await navigation_item_svc.get(db, item_id)
    if not item:
        raise NotFoundException("Navigation item not found")
    
    update_payload = NavigationItemUpdate(orden=payload.get("orden", item.orden))
    item = await navigation_item_svc.update(db, item_id, update_payload)
    await audit_record(db, admin.id, "navigation_item", "reorder", item.id)
    logger.info("navigation_item.reorder", extra={"item_id": str(item.id), "orden": item.orden})
    return success(NavigationItemRead.model_validate(item).model_dump(mode="json"))
