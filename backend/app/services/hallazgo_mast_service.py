"""HallazgoMAST service — async CRUD with enforced per-user ownership."""

from app.models.hallazgo_mast import HallazgoMAST
from app.schemas.hallazgo_mast import HallazgoMASTCreate, HallazgoMASTUpdate
from app.services.base import BaseService

hallazgo_mast_svc = BaseService[HallazgoMAST, HallazgoMASTCreate, HallazgoMASTUpdate](
    HallazgoMAST,
    owner_field="user_id",
    audit_action_prefix="hallazgo_mast",
)
