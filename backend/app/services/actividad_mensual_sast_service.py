"""ActividadMensualSast service — async CRUD with enforced per-user ownership."""

from app.models.actividad_mensual_sast import ActividadMensualSast
from app.schemas.actividad_mensual_sast import ActividadMensualSastCreate, ActividadMensualSastUpdate
from app.services.base import BaseService

actividad_mensual_sast_svc = BaseService[ActividadMensualSast, ActividadMensualSastCreate, ActividadMensualSastUpdate](
    ActividadMensualSast,
    owner_field="user_id",
    audit_action_prefix="actividad_mensual_sast",
)
