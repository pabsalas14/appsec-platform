"""OkrEvidencia service — async CRUD with enforced per-user ownership."""

from app.models.okr_evidencia import OkrEvidencia
from app.schemas.okr_evidencia import OkrEvidenciaCreate, OkrEvidenciaUpdate
from app.services.base import BaseService

okr_evidencia_svc = BaseService[OkrEvidencia, OkrEvidenciaCreate, OkrEvidenciaUpdate](
    OkrEvidencia,
    owner_field="user_id",
    audit_action_prefix="okr_evidencia",
)
