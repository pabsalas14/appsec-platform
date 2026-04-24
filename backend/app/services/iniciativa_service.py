"""Iniciativa service — async CRUD with enforced per-user ownership."""

from app.models.iniciativa import Iniciativa
from app.schemas.iniciativa import IniciativaCreate, IniciativaUpdate
from app.services.base import BaseService

iniciativa_svc = BaseService[Iniciativa, IniciativaCreate, IniciativaUpdate](
    Iniciativa,
    owner_field="user_id",
    audit_action_prefix="iniciativa",
)
