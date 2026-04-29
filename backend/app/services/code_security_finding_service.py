"""Hallazgos SCR — owned por `user_id` (denormalizado desde la revisión)."""

from app.models.code_security_finding import CodeSecurityFinding
from app.schemas.code_security_finding import CodeSecurityFindingCreate, CodeSecurityFindingUpdate
from app.services.base import BaseService

code_security_finding_svc = BaseService[CodeSecurityFinding, CodeSecurityFindingCreate, CodeSecurityFindingUpdate](
    CodeSecurityFinding,
    owner_field="user_id",
    audit_action_prefix="code_security_finding",
)
