"""FlujoEstatus service — async CRUD with enforced per-user ownership."""

from app.models.flujo_estatus import FlujoEstatus
from app.schemas.flujo_estatus import FlujoEstatusCreate, FlujoEstatusUpdate
from app.services.base import BaseService

flujo_estatus_svc = BaseService[FlujoEstatus, FlujoEstatusCreate, FlujoEstatusUpdate](
    FlujoEstatus,
    owner_field="user_id",
    audit_action_prefix="flujo_estatus",
)
