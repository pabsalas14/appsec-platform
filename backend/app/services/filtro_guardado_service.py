"""FiltroGuardado service — async CRUD with enforced per-user ownership."""

from app.models.filtro_guardado import FiltroGuardado
from app.schemas.filtro_guardado import FiltroGuardadoCreate, FiltroGuardadoUpdate
from app.services.base import BaseService

filtro_guardado_svc = BaseService[FiltroGuardado, FiltroGuardadoCreate, FiltroGuardadoUpdate](
    FiltroGuardado,
    owner_field="usuario_id",
    audit_action_prefix="filtro_guardado",
)
