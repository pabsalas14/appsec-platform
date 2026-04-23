"""Subdireccion service — async CRUD with enforced per-user ownership."""

from app.models.subdireccion import Subdireccion
from app.schemas.subdireccion import SubdireccionCreate, SubdireccionUpdate
from app.services.base import BaseService

subdireccion_svc = BaseService[Subdireccion, SubdireccionCreate, SubdireccionUpdate](
    Subdireccion,
    owner_field="user_id",
    audit_action_prefix="subdireccion",
)
