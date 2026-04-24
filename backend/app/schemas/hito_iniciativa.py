"""HitoIniciativa schema — milestone for initiative."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class HitoIniciativaBase(BaseModel):
    """Base schema for HitoIniciativa."""

    nombre: str = Field(..., min_length=1, max_length=255)
    descripcion: Optional[str] = Field(None, max_length=2000)
    fecha_objetivo: datetime = Field(...)
    iniciativa_id: UUID = Field(...)


class HitoIniciativaCreate(HitoIniciativaBase):
    """Schema for creating HitoIniciativa."""

    pass


class HitoIniciativaUpdate(BaseModel):
    """Schema for updating HitoIniciativa (all fields optional)."""

    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    descripcion: Optional[str] = Field(None, max_length=2000)
    fecha_objetivo: Optional[datetime] = None


class HitoIniciativaRead(HitoIniciativaBase):
    """Schema for reading HitoIniciativa."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
