"""Dashboard Builder router — endpoints for custom dashboard creation and management (Fase 2)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.logging import logger
from app.core.response import paginated, success
from app.models.user import User
from app.schemas.custom_dashboard import CustomDashboardCreate, CustomDashboardRead, CustomDashboardUpdate
from app.schemas.custom_dashboard_access import CustomDashboardAccessCreate, CustomDashboardAccessRead
from app.schemas.dashboard_config import DashboardConfigCreate, DashboardConfigRead
from app.services.custom_dashboard_access_service import custom_dashboard_access_svc
from app.services.custom_dashboard_service import custom_dashboard_svc
from app.services.dashboard_config_service import dashboard_config_svc

router = APIRouter(prefix="/dashboard-builder", tags=["Admin · Dashboard Builder"])


# ─── CUSTOM DASHBOARD ENDPOINTS ───


@router.post("/dashboards")
async def create_dashboard(
    data: CustomDashboardCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new custom dashboard."""
    try:
        dashboard = await custom_dashboard_svc.create(
            db=db,
            actor_id=current_user.id,
            data=data,
            created_by=current_user.id,
        )
        result = await custom_dashboard_svc.get_by_id(db=db, id=dashboard.id)
        return success(CustomDashboardRead.model_validate(result))
    except Exception as e:
        logger.exception(f"Create dashboard error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e


@router.get("/dashboards")
async def list_dashboards(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all custom dashboards accessible to current user."""
    try:
        dashboards = await custom_dashboard_svc.list(db=db, skip=skip, limit=limit)
        total = await custom_dashboard_svc.count(db=db)
        items = [CustomDashboardRead.model_validate(d) for d in dashboards]
        return paginated(items, total, skip, limit)
    except Exception as e:
        logger.exception(f"List dashboards error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e


@router.get("/dashboards/{dashboard_id}")
async def get_dashboard(
    dashboard_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific dashboard."""
    try:
        dashboard_uuid = UUID(dashboard_id)
        dashboard = await custom_dashboard_svc.get_by_id(db=db, id=dashboard_uuid)
        if not dashboard:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        return success(CustomDashboardRead.model_validate(dashboard))
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid dashboard ID") from e
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Get dashboard error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e


@router.patch("/dashboards/{dashboard_id}")
async def update_dashboard(
    dashboard_id: str,
    data: CustomDashboardUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a dashboard."""
    try:
        dashboard_uuid = UUID(dashboard_id)
        dashboard = await custom_dashboard_svc.get_by_id(db=db, id=dashboard_uuid)
        if not dashboard:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        if dashboard.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        updated = await custom_dashboard_svc.update(
            db=db,
            actor_id=current_user.id,
            id=dashboard_uuid,
            data=data,
        )
        return success(CustomDashboardRead.model_validate(updated))
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid dashboard ID") from e
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Update dashboard error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e


@router.delete("/dashboards/{dashboard_id}")
async def delete_dashboard(
    dashboard_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a dashboard (soft delete)."""
    try:
        dashboard_uuid = UUID(dashboard_id)
        dashboard = await custom_dashboard_svc.get_by_id(db=db, id=dashboard_uuid)
        if not dashboard:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        if dashboard.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        await custom_dashboard_svc.delete(db=db, actor_id=current_user.id, id=dashboard_uuid)
        return success({"message": "Dashboard deleted"})
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid dashboard ID") from e
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Delete dashboard error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e


# ─── DASHBOARD ACCESS ENDPOINTS ───


@router.post("/dashboards/{dashboard_id}/access")
async def grant_access(
    dashboard_id: str,
    data: CustomDashboardAccessCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Grant access to a dashboard (role or user)."""
    try:
        access = await custom_dashboard_access_svc.create(
            db=db,
            actor_id=current_user.id,
            data=data,
        )
        result = await custom_dashboard_access_svc.get_by_id(db=db, id=access.id)
        return success(CustomDashboardAccessRead.model_validate(result))
    except Exception as e:
        logger.exception(f"Grant access error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e


# ─── DASHBOARD CONFIG ENDPOINTS ───


@router.post("/dashboards/{dashboard_id}/config")
async def configure_widget(
    dashboard_id: str,
    data: DashboardConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Configure widget visibility by role."""
    try:
        config = await dashboard_config_svc.create(
            db=db,
            actor_id=current_user.id,
            data=data,
        )
        result = await dashboard_config_svc.get_by_id(db=db, id=config.id)
        return success(DashboardConfigRead.model_validate(result))
    except Exception as e:
        logger.exception(f"Configure widget error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e
