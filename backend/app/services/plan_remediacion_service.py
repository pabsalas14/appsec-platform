"""PlanRemediacion service — async CRUD with enforced per-user ownership."""

from app.models.plan_remediacion import PlanRemediacion
from app.schemas.plan_remediacion import PlanRemediacionCreate, PlanRemediacionUpdate
from app.services.base import BaseService

plan_remediacion_svc = BaseService[PlanRemediacion, PlanRemediacionCreate, PlanRemediacionUpdate](
    PlanRemediacion,
    owner_field="user_id",
    audit_action_prefix="plan_remediacion",
)
