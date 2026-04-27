"""OkrPlanAnual service — async CRUD with enforced per-user ownership."""

from app.models.okr_plan_anual import OkrPlanAnual
from app.schemas.okr_plan_anual import OkrPlanAnualCreate, OkrPlanAnualUpdate
from app.services.base import BaseService

okr_plan_anual_svc = BaseService[OkrPlanAnual, OkrPlanAnualCreate, OkrPlanAnualUpdate](
    OkrPlanAnual,
    owner_field="user_id",
    audit_action_prefix="okr_plan_anual",
)
