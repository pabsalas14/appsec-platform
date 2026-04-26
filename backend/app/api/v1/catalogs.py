"""Public Catalog endpoints — ``/api/v1/catalogs``.

Unauthenticated, read-only access to catalog values.
Listed in ``tests/test_contract.py::PUBLIC_ROUTES``.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.response import success
from app.models.catalog import Catalog
from app.schemas.catalog import CatalogRead

router = APIRouter()


@router.get("/{catalog_type}")
async def get_catalog_by_type(
    catalog_type: str,
    db: AsyncSession = Depends(get_db),
):
    """Get catalog values by type (public, read-only)."""
    stmt = select(Catalog).where(Catalog.type == catalog_type).where(Catalog.is_active.is_(True))
    obj = (await db.execute(stmt)).scalar_one_or_none()

    if not obj:
        return success(
            {
                "type": catalog_type,
                "values": [],
                "message": f"Catalog {catalog_type!r} not found or inactive",
            }
        )

    return success(CatalogRead.model_validate(obj).model_dump(mode="json"))
