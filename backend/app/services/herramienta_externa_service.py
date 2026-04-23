"""HerramientaExterna service — async CRUD for Global Integrations Config."""

from app.models.herramienta_externa import HerramientaExterna
from app.schemas.herramienta_externa import HerramientaExternaCreate, HerramientaExternaUpdate
from app.services.base import BaseService

herramienta_externa_svc = BaseService[HerramientaExterna, HerramientaExternaCreate, HerramientaExternaUpdate](
    HerramientaExterna,
    owner_field=None,
    audit_action_prefix="herramienta_externa",
)
