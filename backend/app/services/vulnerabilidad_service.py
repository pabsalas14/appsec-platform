"""Vulnerabilidad service — async CRUD with enforced per-user ownership."""

from app.models.vulnerabilidad import Vulnerabilidad
from app.schemas.vulnerabilidad import VulnerabilidadCreate, VulnerabilidadUpdate
from app.services.base import BaseService

vulnerabilidad_svc = BaseService[Vulnerabilidad, VulnerabilidadCreate, VulnerabilidadUpdate](
    Vulnerabilidad,
    owner_field="user_id",
    audit_action_prefix="vulnerabilidad",
)
