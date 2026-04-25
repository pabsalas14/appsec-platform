"""ActualizacionIniciativa service — async CRUD with enforced per-user ownership."""

from app.models.actualizacion_iniciativa import ActualizacionIniciativa
from app.schemas.actualizacion_iniciativa import ActualizacionIniciativaCreate, ActualizacionIniciativaUpdate
from app.services.base import BaseService

actualizacion_iniciativa_svc = BaseService[
    ActualizacionIniciativa, ActualizacionIniciativaCreate, ActualizacionIniciativaUpdate
](
    ActualizacionIniciativa,
    owner_field="user_id",
    audit_action_prefix="actualizacion_iniciativa",
)
