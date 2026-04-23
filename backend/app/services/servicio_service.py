"""Servicio service — async CRUD with enforced per-user ownership."""

from app.models.servicio import Servicio
from app.schemas.servicio import ServicioCreate, ServicioUpdate
from app.services.base import BaseService

servicio_svc = BaseService[Servicio, ServicioCreate, ServicioUpdate](
    Servicio,
    owner_field="user_id",
    audit_action_prefix="servicio",
)
