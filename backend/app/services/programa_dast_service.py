"""ProgramaDast service — async CRUD with enforced per-user ownership."""

from app.models.programa_dast import ProgramaDast
from app.schemas.programa_dast import ProgramaDastCreate, ProgramaDastUpdate
from app.services.base import BaseService

programa_dast_svc = BaseService[ProgramaDast, ProgramaDastCreate, ProgramaDastUpdate](
    ProgramaDast,
    owner_field="user_id",
    audit_action_prefix="programa_dast",
)
