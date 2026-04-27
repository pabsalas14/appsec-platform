"""OkrSubcompromiso service — async CRUD with enforced per-user ownership."""

from app.models.okr_subcompromiso import OkrSubcompromiso
from app.schemas.okr_subcompromiso import OkrSubcompromisoCreate, OkrSubcompromisoUpdate
from app.services.base import BaseService

okr_subcompromiso_svc = BaseService[OkrSubcompromiso, OkrSubcompromisoCreate, OkrSubcompromisoUpdate](
    OkrSubcompromiso,
    owner_field="user_id",
    audit_action_prefix="okr_subcompromiso",
)
