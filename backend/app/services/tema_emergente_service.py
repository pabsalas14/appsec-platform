"""TemaEmergente service — async CRUD with enforced per-user ownership."""

from app.models.tema_emergente import TemaEmergente
from app.schemas.tema_emergente import TemaEmergenteCreate, TemaEmergenteUpdate
from app.services.base import BaseService

tema_emergente_svc = BaseService[TemaEmergente, TemaEmergenteCreate, TemaEmergenteUpdate](
    TemaEmergente,
    owner_field="user_id",
    audit_action_prefix="tema_emergente",
)
