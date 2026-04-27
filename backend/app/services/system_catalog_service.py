"""SystemCatalog service — CRUD operations for system catalogs."""

from app.models.system_catalog import SystemCatalog
from app.schemas.system_catalog import SystemCatalogCreate, SystemCatalogUpdate
from app.services.base import BaseService

system_catalog_svc = BaseService[SystemCatalog, SystemCatalogCreate, SystemCatalogUpdate](
    SystemCatalog,
    owner_field=None,
    default_order_by="tipo",
)

__all__ = ["system_catalog_svc"]
