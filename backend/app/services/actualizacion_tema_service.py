"""ActualizacionTema service — async CRUD with enforced per-user ownership."""

from app.models.actualizacion_tema import ActualizacionTema
from app.schemas.actualizacion_tema import ActualizacionTemaCreate, ActualizacionTemaUpdate
from app.services.base import BaseService

actualizacion_tema_svc = BaseService[ActualizacionTema, ActualizacionTemaCreate, ActualizacionTemaUpdate](
    ActualizacionTema,
    owner_field="user_id",
    audit_action_prefix="actualizacion_tema",
)
