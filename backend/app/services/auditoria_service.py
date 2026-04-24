"""Auditoria service — async CRUD with enforced per-user ownership."""

from app.models.auditoria import Auditoria
from app.schemas.auditoria import AuditoriaCreate, AuditoriaUpdate
from app.services.base import BaseService

auditoria_svc = BaseService[Auditoria, AuditoriaCreate, AuditoriaUpdate](
    Auditoria,
    owner_field="user_id",
    audit_action_prefix="auditoria",
)
