"""ServicioReguladoRegistro service — async CRUD with enforced per-user ownership."""

from app.models.servicio_regulado_registro import ServicioReguladoRegistro
from app.schemas.servicio_regulado_registro import ServicioReguladoRegistroCreate, ServicioReguladoRegistroUpdate
from app.services.base import BaseService

servicio_regulado_registro_svc = BaseService[ServicioReguladoRegistro, ServicioReguladoRegistroCreate, ServicioReguladoRegistroUpdate](
    ServicioReguladoRegistro,
    owner_field="user_id",
    audit_action_prefix="servicio_regulado_registro",
)
