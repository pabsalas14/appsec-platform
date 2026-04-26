"""Catalog schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CatalogValueCreate(BaseModel):
    value: str = Field(..., min_length=1, max_length=255)
    display_name: str = Field(..., min_length=1, max_length=255)
    order: int = 0
    is_active: bool = True


class CatalogValueRead(CatalogValueCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class CatalogBase(BaseModel):
    key: str = Field(..., min_length=1, max_length=255)
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    is_global: bool = False


class CatalogCreate(CatalogBase):
    pass


class CatalogUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    is_global: bool | None = None


class CatalogRead(CatalogBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class CatalogReadWithValues(CatalogRead):
    values: list[CatalogValueRead] = []
