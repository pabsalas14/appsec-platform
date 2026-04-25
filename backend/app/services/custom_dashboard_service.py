"""CustomDashboard service — async CRUD for Dashboard Builder (Fase 2)."""

from app.models.custom_dashboard import CustomDashboard
from app.schemas.custom_dashboard import CustomDashboardCreate, CustomDashboardUpdate
from app.services.base import BaseService

custom_dashboard_svc = BaseService[CustomDashboard, CustomDashboardCreate, CustomDashboardUpdate](
    CustomDashboard,
    owner_field="created_by",
    audit_action_prefix="custom_dashboard",
)
