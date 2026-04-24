"""HitoIniciativa service — async CRUD with enforced per-user ownership."""

from app.models.hito_iniciativa import HitoIniciativa
from app.schemas.hito_iniciativa import HitoIniciativaCreate, HitoIniciativaUpdate
from app.services.base import BaseService

hito_iniciativa_svc = BaseService[HitoIniciativa, HitoIniciativaCreate, HitoIniciativaUpdate](
    HitoIniciativa,
    owner_field="user_id",
    audit_action_prefix="hito_iniciativa",
)
