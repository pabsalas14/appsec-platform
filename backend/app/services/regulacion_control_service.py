"""RegulacionControl service — async CRUD with enforced per-user ownership."""

from app.models.regulacion_control import RegulacionControl
from app.schemas.regulacion_control import RegulacionControlCreate, RegulacionControlUpdate
from app.services.base import BaseService

regulacion_control_svc = BaseService[RegulacionControl, RegulacionControlCreate, RegulacionControlUpdate](
    RegulacionControl,
    owner_field="user_id",
    audit_action_prefix="regulacion_control",
)
