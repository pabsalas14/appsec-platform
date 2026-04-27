"""OkrRevisionQ service — async CRUD with enforced per-user ownership."""

from app.models.okr_revision_q import OkrRevisionQ
from app.schemas.okr_revision_q import OkrRevisionQCreate, OkrRevisionQUpdate
from app.services.base import BaseService

okr_revision_q_svc = BaseService[OkrRevisionQ, OkrRevisionQCreate, OkrRevisionQUpdate](
    OkrRevisionQ,
    owner_field="user_id",
    audit_action_prefix="okr_revision_q",
)
