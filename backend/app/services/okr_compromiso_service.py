"""OkrCompromiso service — async CRUD with enforced per-user ownership."""

from app.models.okr_compromiso import OkrCompromiso
from app.schemas.okr_compromiso import OkrCompromisoCreate, OkrCompromisoUpdate
from app.services.base import BaseService

okr_compromiso_svc = BaseService[OkrCompromiso, OkrCompromisoCreate, OkrCompromisoUpdate](
    OkrCompromiso,
    owner_field="user_id",
    audit_action_prefix="okr_compromiso",
)
