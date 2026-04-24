"""EvidenciaAuditoria service — async CRUD with enforced per-user ownership and SHA-256 hash validation."""

from app.models.evidencia_auditoria import EvidenciaAuditoria
from app.schemas.evidencia_auditoria import EvidenciaAuditoriaCreate, EvidenciaAuditoriaUpdate
from app.services.base import BaseService

evidencia_auditoria_svc = BaseService[EvidenciaAuditoria, EvidenciaAuditoriaCreate, EvidenciaAuditoriaUpdate](
    EvidenciaAuditoria,
    owner_field="user_id",
    audit_action_prefix="evidencia_auditoria",
)
