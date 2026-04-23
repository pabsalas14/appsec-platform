"""Repositorio service — async CRUD with enforced per-user ownership."""

from app.models.repositorio import Repositorio
from app.schemas.repositorio import RepositorioCreate, RepositorioUpdate
from app.services.base import BaseService

repositorio_svc = BaseService[Repositorio, RepositorioCreate, RepositorioUpdate](
    Repositorio,
    owner_field="user_id",
    audit_action_prefix="repositorio",
)
