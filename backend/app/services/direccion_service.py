"""Direccion service — async CRUD with enforced per-user ownership."""

from app.models.direccion import Direccion
from app.schemas.direccion import DireccionCreate, DireccionUpdate
from app.services.base import BaseService

direccion_svc = BaseService[Direccion, DireccionCreate, DireccionUpdate](
    Direccion,
    owner_field="user_id",
    audit_action_prefix="direccion",
)
