"""OkrCategoria service — async CRUD with enforced per-user ownership."""

from app.models.okr_categoria import OkrCategoria
from app.schemas.okr_categoria import OkrCategoriaCreate, OkrCategoriaUpdate
from app.services.base import BaseService

okr_categoria_svc = BaseService[OkrCategoria, OkrCategoriaCreate, OkrCategoriaUpdate](
    OkrCategoria,
    owner_field="user_id",
    audit_action_prefix="okr_categoria",
)
