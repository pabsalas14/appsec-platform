"""PipelineRelease service — async CRUD with enforced per-user ownership."""

from app.models.pipeline_release import PipelineRelease
from app.schemas.pipeline_release import PipelineReleaseCreate, PipelineReleaseUpdate
from app.services.base import BaseService

pipeline_release_svc = BaseService[PipelineRelease, PipelineReleaseCreate, PipelineReleaseUpdate](
    PipelineRelease,
    owner_field="user_id",
    audit_action_prefix="pipeline_release",
)
