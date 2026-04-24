"""HallazgoSast service — async CRUD with enforced per-user ownership."""

from app.models.hallazgo_sast import HallazgoSast
from app.schemas.hallazgo_sast import HallazgoSastCreate, HallazgoSastUpdate
from app.services.base import BaseService

hallazgo_sast_svc = BaseService[HallazgoSast, HallazgoSastCreate, HallazgoSastUpdate](
    HallazgoSast,
    owner_field="user_id",
    audit_action_prefix="hallazgo_sast",
)
