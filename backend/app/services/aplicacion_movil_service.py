"""AplicacionMovil service — async CRUD with enforced per-user ownership."""

from app.models.aplicacion_movil import AplicacionMovil
from app.schemas.aplicacion_movil import AplicacionMovilCreate, AplicacionMovilUpdate
from app.services.base import BaseService

aplicacion_movil_svc = BaseService[AplicacionMovil, AplicacionMovilCreate, AplicacionMovilUpdate](
    AplicacionMovil,
    owner_field="user_id",
    audit_action_prefix="aplicacion_movil",
)
