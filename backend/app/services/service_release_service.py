"""ServiceRelease service — async CRUD with enforced per-user ownership."""

from app.models.service_release import ServiceRelease
from app.schemas.service_release import ServiceReleaseCreate, ServiceReleaseUpdate
from app.services.base import BaseService

service_release_svc = BaseService[ServiceRelease, ServiceReleaseCreate, ServiceReleaseUpdate](
    ServiceRelease,
    owner_field="user_id",
    audit_action_prefix="service_release",
)
