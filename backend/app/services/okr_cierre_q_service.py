"""OkrCierreQ service — async CRUD with enforced per-user ownership."""

from app.models.okr_cierre_q import OkrCierreQ
from app.schemas.okr_cierre_q import OkrCierreQCreate, OkrCierreQUpdate
from app.services.base import BaseService

okr_cierre_q_svc = BaseService[OkrCierreQ, OkrCierreQCreate, OkrCierreQUpdate](
    OkrCierreQ,
    owner_field="user_id",
    audit_action_prefix="okr_cierre_q",
)
