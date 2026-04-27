"""Catalog schemas — dynamic enum management."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CatalogValueItem(BaseModel):
    """Individual item in a catalog's values array."""

    label: str = Field(..., description="Display label")
    value: str = Field(..., description="Internal value")
    color: str | None = Field(None, description="Optional hex color code")
    order: int = Field(0, description="Display order")
    description: str | None = Field(None, description="Optional description")


class CatalogRead(BaseModel):
    """Catalog read response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    display_name: str
    description: str | None = None
    values: list[dict[str, Any]] = Field(default_factory=list)
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CatalogCreate(BaseModel):
    """Catalog creation payload."""

    type: str = Field(..., description="Catalog type (e.g. 'severidades')")
    display_name: str = Field(..., description="Display name")
    description: str | None = None
    values: list[dict[str, Any]] = Field(default_factory=list, description="Initial values array")


class CatalogUpdate(BaseModel):
    """Catalog update payload."""

    display_name: str | None = None
    description: str | None = None
    values: list[dict[str, Any]] | None = None
    is_active: bool | None = None
