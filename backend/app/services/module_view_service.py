"""Module View service — admin-managed CRUD."""

from app.models.module_view import ModuleView
from app.schemas.module_view import ModuleViewCreate, ModuleViewUpdate
from app.services.base import BaseService

module_view_svc = BaseService[ModuleView, ModuleViewCreate, ModuleViewUpdate](
    ModuleView,
    audit_action_prefix="module_view",
)
