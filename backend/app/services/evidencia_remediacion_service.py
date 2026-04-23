"""EvidenciaRemediacion service — async CRUD with enforced per-user ownership."""

from app.models.evidencia_remediacion import EvidenciaRemediacion
from app.schemas.evidencia_remediacion import EvidenciaRemediacionCreate, EvidenciaRemediacionUpdate
from app.services.base import BaseService

evidencia_remediacion_svc = BaseService[EvidenciaRemediacion, EvidenciaRemediacionCreate, EvidenciaRemediacionUpdate](
    EvidenciaRemediacion,
    owner_field="user_id",
    audit_action_prefix="evidencia_remediacion",
)
