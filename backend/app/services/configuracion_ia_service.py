"""ConfiguracionIA service — IA provider configuration CRUD operations."""

from app.models.configuracion_ia import ConfiguracionIA
from app.schemas.configuracion_ia import ConfiguracionIACreate, ConfiguracionIAUpdate
from app.services.base import BaseService

configuracion_ia_svc = BaseService[ConfiguracionIA, ConfiguracionIACreate, ConfiguracionIAUpdate](
    ConfiguracionIA,
    owner_field=None,
    default_order_by="provider",
)

__all__ = ["configuracion_ia_svc"]
