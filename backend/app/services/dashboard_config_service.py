"""DashboardConfig service — widget-level visibility configuration (Fase 2)."""

from app.models.dashboard_config import DashboardConfig
from app.schemas.dashboard_config import DashboardConfigCreate, DashboardConfigUpdate
from app.services.base import BaseService

dashboard_config_svc = BaseService[DashboardConfig, DashboardConfigCreate, DashboardConfigUpdate](
    DashboardConfig,
    owner_field=None,  # No single owner; admin-controlled config
    audit_action_prefix="dashboard_config",
)
