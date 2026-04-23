"""ControlSeguridad service — async CRUD with enforced per-user ownership."""

from app.models.control_seguridad import ControlSeguridad
from app.schemas.control_seguridad import ControlSeguridadCreate, ControlSeguridadUpdate
from app.services.base import BaseService

control_seguridad_svc = BaseService[ControlSeguridad, ControlSeguridadCreate, ControlSeguridadUpdate](
    ControlSeguridad,
    owner_field="user_id",
    audit_action_prefix="control_seguridad",
)
