"""SesionThreatModeling service — async CRUD with enforced per-user ownership."""

from app.models.sesion_threat_modeling import SesionThreatModeling
from app.schemas.sesion_threat_modeling import SesionThreatModelingCreate, SesionThreatModelingUpdate
from app.services.base import BaseService

sesion_threat_modeling_svc = BaseService[SesionThreatModeling, SesionThreatModelingCreate, SesionThreatModelingUpdate](
    SesionThreatModeling,
    owner_field="user_id",
    audit_action_prefix="sesion_threat_modeling",
)
