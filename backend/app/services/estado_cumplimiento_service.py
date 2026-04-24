"""EstadoCumplimiento service — async CRUD with enforced per-user ownership."""

from app.models.estado_cumplimiento import EstadoCumplimiento
from app.schemas.estado_cumplimiento import EstadoCumplimientoCreate, EstadoCumplimientoUpdate
from app.services.base import BaseService

estado_cumplimiento_svc = BaseService[EstadoCumplimiento, EstadoCumplimientoCreate, EstadoCumplimientoUpdate](
    EstadoCumplimiento,
    owner_field="user_id",
    audit_action_prefix="estado_cumplimiento",
)
