"""ControlMitigacion service — async CRUD with enforced per-user ownership."""

from app.models.control_mitigacion import ControlMitigacion
from app.schemas.control_mitigacion import ControlMitigacionCreate, ControlMitigacionUpdate
from app.services.base import BaseService

control_mitigacion_svc = BaseService[ControlMitigacion, ControlMitigacionCreate, ControlMitigacionUpdate](
    ControlMitigacion,
    owner_field="user_id",
    audit_action_prefix="control_mitigacion",
)
