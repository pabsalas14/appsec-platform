"""CierreConclusion service — async CRUD with enforced per-user ownership."""

from app.models.cierre_conclusion import CierreConclusion
from app.schemas.cierre_conclusion import CierreConclusionCreate, CierreConclusionUpdate
from app.services.base import BaseService

cierre_conclusion_svc = BaseService[CierreConclusion, CierreConclusionCreate, CierreConclusionUpdate](
    CierreConclusion,
    owner_field="user_id",
    audit_action_prefix="cierre_conclusion",
)
