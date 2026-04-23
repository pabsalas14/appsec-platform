"""HistorialVulnerabilidad service — async CRUD with enforced per-user ownership."""

from app.models.historial_vulnerabilidad import HistorialVulnerabilidad
from app.schemas.historial_vulnerabilidad import HistorialVulnerabilidadCreate, HistorialVulnerabilidadUpdate
from app.services.base import BaseService

historial_vulnerabilidad_svc = BaseService[HistorialVulnerabilidad, HistorialVulnerabilidadCreate, HistorialVulnerabilidadUpdate](
    HistorialVulnerabilidad,
    owner_field="user_id",
    audit_action_prefix="historial_vulnerabilidad",
)
