"""CustomDashboardAccess service — dashboard access control (Fase 2)."""

from app.models.custom_dashboard_access import CustomDashboardAccess
from app.schemas.custom_dashboard_access import CustomDashboardAccessCreate, CustomDashboardAccessUpdate
from app.services.base import BaseService

custom_dashboard_access_svc = BaseService[
    CustomDashboardAccess, CustomDashboardAccessCreate, CustomDashboardAccessUpdate
](
    CustomDashboardAccess,
    owner_field=None,  # No single owner; access is multi-party
    audit_action_prefix="dashboard_access",
)
