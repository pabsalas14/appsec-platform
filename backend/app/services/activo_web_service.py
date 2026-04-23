"""ActivoWeb service — async CRUD with enforced per-user ownership."""

from app.models.activo_web import ActivoWeb
from app.schemas.activo_web import ActivoWebCreate, ActivoWebUpdate
from app.services.base import BaseService

activo_web_svc = BaseService[ActivoWeb, ActivoWebCreate, ActivoWebUpdate](
    ActivoWeb,
    owner_field="user_id",
    audit_action_prefix="activo_web",
)
