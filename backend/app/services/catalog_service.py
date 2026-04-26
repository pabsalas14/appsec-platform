"""Catalog service — admin-managed dynamic enums.

Catalogs have NO ``owner_field`` because they are global admin resources.
All endpoints using this service must be gated by ``require_role('admin')``.

``audit_action_prefix="catalog"`` ensures every mutation writes an
``audit_logs`` row (``catalog.create``, ``catalog.update``, ``catalog.delete``).
"""

from app.models.catalog import Catalog
from app.schemas.catalog import CatalogCreate, CatalogUpdate
from app.services.base import BaseService

catalog_svc = BaseService[Catalog, CatalogCreate, CatalogUpdate](
    Catalog,
    owner_field=None,
    audit_action_prefix="catalog",
)
