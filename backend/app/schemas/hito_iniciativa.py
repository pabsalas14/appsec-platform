"""HitoIniciativa schema — milestone for initiative."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HitoIniciativaBase(BaseModel):
    """Base schema for HitoIniciativa."""

    nombre: str = Field(..., min_length=1, max_length=255)
    descripcion: str | None = Field(None, max_length=2000)
    fecha_objetivo: datetime = Field(...)
    iniciativa_id: UUID = Field(...)


class HitoIniciativaCreate(HitoIniciativaBase):
    """Schema for creating HitoIniciativa."""

    pass


class HitoIniciativaUpdate(BaseModel):
    """Schema for updating HitoIniciativa (all fields optional)."""

    nombre: str | None = Field(None, min_length=1, max_length=255)
    descripcion: str | None = Field(None, max_length=2000)
    fecha_objetivo: datetime | None = None


class HitoIniciativaRead(HitoIniciativaBase):
    """Schema for reading HitoIniciativa."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
