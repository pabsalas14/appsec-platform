"""HallazgoDast service — async CRUD with enforced per-user ownership."""

from app.models.hallazgo_dast import HallazgoDast
from app.schemas.hallazgo_dast import HallazgoDastCreate, HallazgoDastUpdate
from app.services.base import BaseService

hallazgo_dast_svc = BaseService[HallazgoDast, HallazgoDastCreate, HallazgoDastUpdate](
    HallazgoDast,
    owner_field="user_id",
    audit_action_prefix="hallazgo_dast",
)
