"""ProgramaThreatModeling service — async CRUD with enforced per-user ownership."""

from app.models.programa_threat_modeling import ProgramaThreatModeling
from app.schemas.programa_threat_modeling import ProgramaThreatModelingCreate, ProgramaThreatModelingUpdate
from app.services.base import BaseService

programa_threat_modeling_svc = BaseService[
    ProgramaThreatModeling, ProgramaThreatModelingCreate, ProgramaThreatModelingUpdate
](
    ProgramaThreatModeling,
    owner_field="user_id",
    audit_action_prefix="programa_threat_modeling",
)
