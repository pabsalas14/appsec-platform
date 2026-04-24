"""DashboardConfig service — system-level dashboard widget visibility configuration."""

from app.models.dashboard_config import DashboardConfig
from app.schemas.dashboard_config import DashboardConfigCreate, DashboardConfigUpdate
from app.services.base import BaseService

dashboard_config_svc = BaseService[DashboardConfig, DashboardConfigCreate, DashboardConfigUpdate](
    DashboardConfig,
    audit_action_prefix="dashboard_config",
)
