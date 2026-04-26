"""Admin Module View endpoints — user-owned view configurations per module."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import NotFoundException
from app.core.logging import logger
from app.core.response import paginated, success
from app.models.module_view import ModuleView
from app.models.user import User
from app.schemas.module_view import (
    ModuleViewCreate,
    ModuleViewList,
    ModuleViewRead,
    ModuleViewUpdate,
)
from app.services.audit_service import record as audit_record
from app.services.module_view_service import module_view_svc

router = APIRouter()


@router.get("", response_model=ModuleViewList)
async def list_views(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List all module views (paginated, admin-only)."""
    rows = await module_view_svc.list(db, skip=skip, limit=limit)
    total = await db.scalar(select(func.count()).select_from(ModuleView).where(ModuleView.deleted_at.is_(None)))
    logger.info("module_view.list", extra={"skip": skip, "limit": limit, "total": total})
    return paginated(
        [ModuleViewRead.model_validate(r).model_dump(mode="json") for r in rows],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("", status_code=201)
async def create_view(
    payload: ModuleViewCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Create a new module view (admin-only; real users use authenticated endpoint)."""
    view = await module_view_svc.create(db, payload, extra={"user_id": admin.id})
    await audit_record(
        db,
        action="module_view.create",
        entity_type="module_views",
        entity_id=str(view.id),
        metadata={
            "module": view.module_name,
            "tipo": view.tipo,
            "user_id": str(view.user_id),
        },
    )
    logger.info("module_view.create", extra={"view_id": str(view.id), "module": view.module_name})
    return success(ModuleViewRead.model_validate(view).model_dump(mode="json"), status_code=201)


@router.get("/{view_id}")
async def get_view(
    view_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Retrieve a single module view."""
    view = await module_view_svc.get(db, view_id)
    if not view:
        raise NotFoundException("View not found")
    return success(ModuleViewRead.model_validate(view).model_dump(mode="json"))


@router.patch("/{view_id}")
async def update_view(
    view_id: uuid.UUID,
    payload: ModuleViewUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Update a module view."""
    view = await module_view_svc.get(db, view_id)
    if not view:
        raise NotFoundException("View not found")

    old_values = {
        "nombre": view.nombre,
        "tipo": view.tipo,
        "page_size": view.page_size,
    }

    view = await module_view_svc.update(db, view_id, payload)
    await audit_record(
        db,
        action="module_view.update",
        entity_type="module_views",
        entity_id=str(view_id),
        metadata={
            "changes": {
                "nombre": {"old": old_values["nombre"], "new": view.nombre},
                "tipo": {"old": old_values["tipo"], "new": view.tipo},
            }
        },
    )
    logger.info("module_view.update", extra={"view_id": str(view_id)})
    return success(ModuleViewRead.model_validate(view).model_dump(mode="json"))


@router.delete("/{view_id}", status_code=204)
async def delete_view(
    view_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Delete a module view (soft delete)."""
    view = await module_view_svc.get(db, view_id)
    if not view:
        raise NotFoundException("View not found")

    await module_view_svc.delete(db, view_id, scope={"user_id": view.user_id}, actor_id=admin.id)
    await audit_record(
        db,
        action="module_view.delete",
        entity_type="module_views",
        entity_id=str(view_id),
        metadata={"module": view.module_name},
    )
    logger.info("module_view.delete", extra={"view_id": str(view_id)})
    return None
