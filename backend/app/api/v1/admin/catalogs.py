"""Admin Catalog management endpoints — ``/api/v1/admin/catalogs``.

All routes require ``role=admin``. Mutations write audit entries via
``catalog_svc`` (prefix ``catalog.*``).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import ConflictException, NotFoundException
from app.core.response import paginated, success
from app.models.catalog import Catalog
from app.models.user import User
from app.schemas.catalog import CatalogCreate, CatalogRead, CatalogUpdate
from app.services.catalog_service import catalog_svc

router = APIRouter()


@router.get("")
async def list_catalogs(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
    is_active: bool | None = Query(default=None),
    q: str | None = Query(default=None, description="Search by type/display_name"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
):
    """List all catalogs with optional filters (admin only)."""
    filters = []
    if is_active is not None:
        filters.append(Catalog.is_active.is_(is_active))
    if q:
        like = f"%{q.lower()}%"
        filters.append(func.lower(Catalog.type).like(like) | func.lower(Catalog.display_name).like(like))

    count_stmt = select(func.count()).select_from(Catalog)
    for f in filters:
        count_stmt = count_stmt.where(f)
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = select(Catalog)
    for f in filters:
        stmt = stmt.where(f)
    stmt = stmt.order_by(Catalog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()

    return paginated(
        [CatalogRead.model_validate(c).model_dump(mode="json") for c in rows],
        page=page,
        page_size=page_size,
        total=int(total),
    )


@router.post("")
async def create_catalog(
    payload: CatalogCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Create a new catalog (admin only)."""
    existing = await db.execute(select(Catalog).where(Catalog.type == payload.type))
    if existing.scalar_one_or_none():
        raise ConflictException(f"Catalog type {payload.type!r} already exists")

    obj = await catalog_svc.create(db, payload)
    return success(CatalogRead.model_validate(obj).model_dump(mode="json"))


@router.get("/{catalog_id}")
async def get_catalog(
    catalog_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Get a single catalog by ID (admin only)."""
    obj = await catalog_svc.get_by_id(db, catalog_id)
    if not obj:
        raise NotFoundException(f"Catalog {catalog_id!r} not found")
    return success(CatalogRead.model_validate(obj).model_dump(mode="json"))


@router.patch("/{catalog_id}")
async def update_catalog(
    catalog_id: str,
    payload: CatalogUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Update a catalog by ID (admin only)."""
    obj = await catalog_svc.get_by_id(db, catalog_id)
    if not obj:
        raise NotFoundException(f"Catalog {catalog_id!r} not found")

    obj = await catalog_svc.update(db, catalog_id, payload)
    return success(CatalogRead.model_validate(obj).model_dump(mode="json"))


@router.delete("/{catalog_id}")
async def delete_catalog(
    catalog_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Delete a catalog by ID (admin only)."""
    obj = await catalog_svc.get_by_id(db, catalog_id)
    if not obj:
        raise NotFoundException(f"Catalog {catalog_id!r} not found")

    await catalog_svc.delete(db, catalog_id)
    return success({"id": catalog_id})
