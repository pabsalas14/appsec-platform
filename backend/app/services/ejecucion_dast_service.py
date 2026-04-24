"""EjecucionDast service — async CRUD with enforced per-user ownership."""

from app.models.ejecucion_dast import EjecucionDast
from app.schemas.ejecucion_dast import EjecucionDastCreate, EjecucionDastUpdate
from app.services.base import BaseService

ejecucion_dast_svc = BaseService[EjecucionDast, EjecucionDastCreate, EjecucionDastUpdate](
    EjecucionDast,
    owner_field="user_id",
    audit_action_prefix="ejecucion_dast",
)
