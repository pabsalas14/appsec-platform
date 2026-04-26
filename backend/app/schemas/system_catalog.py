"""SystemCatalog schemas — pydantic models for API validation."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SystemCatalogBase(BaseModel):
    """Shared fields."""

    tipo: str = Field(min_length=1, max_length=128)
    key: str = Field(min_length=1, max_length=256)
    values: Any = Field(default_factory=dict)
    activo: bool = True
    descripcion: str | None = None


class SystemCatalogCreate(SystemCatalogBase):
    """Payload for POST /system-catalogs."""

    pass


class SystemCatalogUpdate(BaseModel):
    """Payload for PATCH /system-catalogs/{id}."""

    values: Any | None = None
    activo: bool | None = None
    descripcion: str | None = None


class SystemCatalogRead(SystemCatalogBase):
    """Response model for GET /system-catalogs/{id}."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    updated_at: datetime


class SystemCatalogList(BaseModel):
    """Response model for GET /system-catalogs (paginated list)."""

    model_config = ConfigDict(from_attributes=True)

    items: list[SystemCatalogRead]
    total: int
    skip: int
    limit: int


__all__ = [
    "SystemCatalogCreate",
    "SystemCatalogList",
    "SystemCatalogRead",
    "SystemCatalogUpdate",
]
