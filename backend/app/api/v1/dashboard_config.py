"""DashboardConfig CRUD endpoints — role-based dashboard widget visibility (admin-only)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.core.response import success, paginated
from app.models.user import User
from app.models.dashboard_config import DashboardConfig
from app.schemas.dashboard_config import DashboardConfigCreate, DashboardConfigRead, DashboardConfigUpdate
from app.services.dashboard_config_service import dashboard_config_svc

router = APIRouter()


@router.get("")
async def list_dashboard_configs(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("super_admin")),
    page: int = 1,
    page_size: int = 50,
):
    """List all dashboard configs (super_admin only)."""
    items = await dashboard_config_svc.list(db, page=page, page_size=page_size)
    total = await dashboard_config_svc.count(db)
    return paginated(
        [DashboardConfigRead.model_validate(x).model_dump(mode="json") for x in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/{id}")
async def get_dashboard_config(
    id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("super_admin")),
):
    """Get a single dashboard config by ID (super_admin only)."""
    entity = await dashboard_config_svc.get(db, id)
    if entity is None:
        return success(None)
    return success(DashboardConfigRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_dashboard_config(
    entity_in: DashboardConfigCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("super_admin")),
):
    """Create a new dashboard config (super_admin only)."""
    entity = await dashboard_config_svc.create(db, entity_in)
    return success(DashboardConfigRead.model_validate(entity).model_dump(mode="json"), status_code=201)


@router.patch("/{id}")
async def update_dashboard_config(
    id: str,
    entity_in: DashboardConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("super_admin")),
):
    """Update a dashboard config (super_admin only)."""
    updated = await dashboard_config_svc.update(db, id, entity_in)
    if updated is None:
        return success(None)
    return success(DashboardConfigRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_dashboard_config(
    id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("super_admin")),
):
    """Delete a dashboard config (super_admin only)."""
    await dashboard_config_svc.delete(db, id)
    return success(None, meta={"message": "DashboardConfig deleted"})
