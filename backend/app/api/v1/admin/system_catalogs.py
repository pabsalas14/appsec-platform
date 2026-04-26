"""Admin System Catalog endpoints — key/value catalog for system-wide classifications."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import ConflictException, NotFoundException
from app.core.logging import logger
from app.core.response import paginated, success
from app.models.system_catalog import SystemCatalog
from app.models.user import User
from app.schemas.system_catalog import (
    SystemCatalogCreate,
    SystemCatalogList,
    SystemCatalogRead,
    SystemCatalogUpdate,
)
from app.services.audit_service import record as audit_record
from app.services.system_catalog_service import system_catalog_svc

router = APIRouter()


@router.get("", response_model=SystemCatalogList)
async def list_catalogs(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List all system catalogs (paginated)."""
    rows = await system_catalog_svc.list(db, skip=skip, limit=limit)
    total = await db.scalar(select(func.count()).select_from(SystemCatalog))
    logger.info("system_catalog.list", extra={"skip": skip, "limit": limit, "total": total})
    return paginated(
        [SystemCatalogRead.model_validate(r).model_dump(mode="json") for r in rows],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("", status_code=201)
async def create_catalog(
    payload: SystemCatalogCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Create a new system catalog entry."""
    existing = await db.scalar(
        select(SystemCatalog).where(
            (SystemCatalog.tipo == payload.tipo) & (SystemCatalog.key == payload.key)
        )
    )
    if existing:
        raise ConflictException("Catalog entry with this tipo/key already exists")

    catalog = await system_catalog_svc.create(db, payload)
    await audit_record(
        db,
        action="system_catalog.create",
        entity_type="system_catalogs",
        entity_id=str(catalog.id),
        metadata={
            "tipo": catalog.tipo,
            "key": catalog.key,
        },
    )
    logger.info("system_catalog.create", extra={"catalog_id": str(catalog.id), "tipo": catalog.tipo})
    return success(SystemCatalogRead.model_validate(catalog).model_dump(mode="json"), status_code=201)


@router.get("/{catalog_id}")
async def get_catalog(
    catalog_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Retrieve a single catalog entry."""
    catalog = await system_catalog_svc.get(db, catalog_id)
    if not catalog:
        raise NotFoundException("Catalog not found")
    return success(SystemCatalogRead.model_validate(catalog).model_dump(mode="json"))


@router.patch("/{catalog_id}")
async def update_catalog(
    catalog_id: uuid.UUID,
    payload: SystemCatalogUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Update a catalog entry."""
    catalog = await system_catalog_svc.get(db, catalog_id)
    if not catalog:
        raise NotFoundException("Catalog not found")

    old_values = {"values": catalog.values, "activo": catalog.activo}

    catalog = await system_catalog_svc.update(db, catalog_id, payload)
    await audit_record(
        db,
        action="system_catalog.update",
        entity_type="system_catalogs",
        entity_id=str(catalog_id),
        metadata={
            "changes": {
                "values": {"old": old_values["values"], "new": catalog.values},
                "activo": {"old": old_values["activo"], "new": catalog.activo},
            }
        },
    )
    logger.info("system_catalog.update", extra={"catalog_id": str(catalog_id)})
    return success(SystemCatalogRead.model_validate(catalog).model_dump(mode="json"))


@router.delete("/{catalog_id}", status_code=204)
async def delete_catalog(
    catalog_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Delete a catalog entry (hard delete)."""
    catalog = await system_catalog_svc.get(db, catalog_id)
    if not catalog:
        raise NotFoundException("Catalog not found")

    await system_catalog_svc.delete(db, catalog_id)
    await audit_record(
        db,
        action="system_catalog.delete",
        entity_type="system_catalogs",
        entity_id=str(catalog_id),
        metadata={"tipo": catalog.tipo, "key": catalog.key},
    )
    logger.info("system_catalog.delete", extra={"catalog_id": str(catalog_id)})
    return None
