"""HallazgoAuditoria service — async CRUD with enforced per-user ownership."""

from app.models.hallazgo_auditoria import HallazgoAuditoria
from app.schemas.hallazgo_auditoria import HallazgoAuditoriaCreate, HallazgoAuditoriaUpdate
from app.services.base import BaseService

hallazgo_auditoria_svc = BaseService[HallazgoAuditoria, HallazgoAuditoriaCreate, HallazgoAuditoriaUpdate](
    HallazgoAuditoria,
    owner_field="user_id",
    audit_action_prefix="hallazgo_auditoria",
)
