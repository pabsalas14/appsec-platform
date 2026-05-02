"""FastAPI v1 Routers - SCR Module Integration"""

from fastapi import APIRouter

# Import all routers
from app.api.v1 import (
    scr_dashboard,
    scr_admin,
    scr_forensic,
    scr_bulk_actions,
)

# Create main router
api_router = APIRouter(prefix="/api/v1")

# Register SCR routers
def register_scr_routers():
    """Register all SCR module routers."""

    # Dashboard Endpoints
    api_router.include_router(
        scr_dashboard.router,
        tags=["SCR Dashboard"]
    )

    # Admin Configuration Endpoints
    api_router.include_router(
        scr_admin.router,
        tags=["SCR Admin Configuration"]
    )

    # Forensic Investigation Endpoints
    api_router.include_router(
        scr_forensic.router,
        tags=["SCR Forensic Investigation"]
    )

    # Bulk Actions Endpoints
    api_router.include_router(
        scr_bulk_actions.router,
        tags=["SCR Bulk Actions"]
    )

    return api_router


# Auto-register on import
api_router = register_scr_routers()

__all__ = ["api_router"]
