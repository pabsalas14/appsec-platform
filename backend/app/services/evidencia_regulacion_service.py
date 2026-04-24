"""EvidenciaRegulacion service — async CRUD with enforced per-user ownership."""

from app.models.evidencia_regulacion import EvidenciaRegulacion
from app.schemas.evidencia_regulacion import EvidenciaRegulacionCreate, EvidenciaRegulacionUpdate
from app.services.base import BaseService

evidencia_regulacion_svc = BaseService[EvidenciaRegulacion, EvidenciaRegulacionCreate, EvidenciaRegulacionUpdate](
    EvidenciaRegulacion,
    owner_field="user_id",
    audit_action_prefix="evidencia_regulacion",
)
