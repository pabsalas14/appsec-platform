"""HallazgoTercero service — async CRUD with enforced per-user ownership."""

from app.models.hallazgo_tercero import HallazgoTercero
from app.schemas.hallazgo_tercero import HallazgoTerceroCreate, HallazgoTerceroUpdate
from app.services.base import BaseService

hallazgo_tercero_svc = BaseService[HallazgoTercero, HallazgoTerceroCreate, HallazgoTerceroUpdate](
    HallazgoTercero,
    owner_field="user_id",
    audit_action_prefix="hallazgo_tercero",
)
