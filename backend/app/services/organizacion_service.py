"""Organizacion service — async CRUD with enforced per-user ownership."""

from app.models.organizacion import Organizacion
from app.schemas.organizacion import OrganizacionCreate, OrganizacionUpdate
from app.services.base import BaseService

organizacion_svc = BaseService[Organizacion, OrganizacionCreate, OrganizacionUpdate](
    Organizacion,
    owner_field="user_id",
    audit_action_prefix="organizacion",
)
