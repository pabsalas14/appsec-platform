"""Gerencia service — async CRUD with enforced per-user ownership."""

from app.models.gerencia import Gerencia
from app.schemas.gerencia import GerenciaCreate, GerenciaUpdate
from app.services.base import BaseService

gerencia_svc = BaseService[Gerencia, GerenciaCreate, GerenciaUpdate](
    Gerencia,
    owner_field="user_id",
    audit_action_prefix="gerencia",
)
