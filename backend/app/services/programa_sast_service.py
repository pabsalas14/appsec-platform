"""ProgramaSast service — async CRUD with enforced per-user ownership."""

from app.models.programa_sast import ProgramaSast
from app.schemas.programa_sast import ProgramaSastCreate, ProgramaSastUpdate
from app.services.base import BaseService

programa_sast_svc = BaseService[ProgramaSast, ProgramaSastCreate, ProgramaSastUpdate](
    ProgramaSast,
    owner_field="user_id",
    audit_action_prefix="programa_sast",
)
