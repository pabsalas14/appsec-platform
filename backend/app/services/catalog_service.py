"""Catalog service — admin-managed CRUD."""

from app.models.catalog import Catalog, CatalogValue
from app.schemas.catalog import CatalogCreate, CatalogUpdate, CatalogValueCreate
from app.services.base import BaseService

catalog_svc = BaseService[Catalog, CatalogCreate, CatalogUpdate](
    Catalog,
    audit_action_prefix="catalog",
)

catalog_value_svc = BaseService[CatalogValue, CatalogValueCreate, CatalogValueCreate](
    CatalogValue,
    audit_action_prefix="catalog_value",
)
