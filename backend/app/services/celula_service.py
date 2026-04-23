"""Celula service — async CRUD with enforced per-user ownership."""

from app.models.celula import Celula
from app.schemas.celula import CelulaCreate, CelulaUpdate
from app.services.base import BaseService

celula_svc = BaseService[Celula, CelulaCreate, CelulaUpdate](
    Celula,
    owner_field="user_id",
    audit_action_prefix="celula",
)
