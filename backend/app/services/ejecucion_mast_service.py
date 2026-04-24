"""EjecucionMAST service — async CRUD with enforced per-user ownership."""

from app.models.ejecucion_mast import EjecucionMAST
from app.schemas.ejecucion_mast import EjecucionMASTCreate, EjecucionMASTUpdate
from app.services.base import BaseService

ejecucion_mast_svc = BaseService[EjecucionMAST, EjecucionMASTCreate, EjecucionMASTUpdate](
    EjecucionMAST,
    owner_field="user_id",
    audit_action_prefix="ejecucion_mast",
)
