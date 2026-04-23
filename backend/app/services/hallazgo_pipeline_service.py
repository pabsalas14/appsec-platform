"""HallazgoPipeline service — async CRUD with enforced per-user ownership."""

from app.models.hallazgo_pipeline import HallazgoPipeline
from app.schemas.hallazgo_pipeline import HallazgoPipelineCreate, HallazgoPipelineUpdate
from app.services.base import BaseService

hallazgo_pipeline_svc = BaseService[HallazgoPipeline, HallazgoPipelineCreate, HallazgoPipelineUpdate](
    HallazgoPipeline,
    owner_field="user_id",
    audit_action_prefix="hallazgo_pipeline",
)
