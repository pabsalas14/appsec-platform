"""Auditoria schema — audit record."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AuditoriaBase(BaseModel):
    """Base schema for Auditoria."""

    titulo: str = Field(..., min_length=1, max_length=255)
    tipo: str = Field(..., min_length=1, max_length=100)
    alcance: str = Field(..., min_length=1)
    estado: str = Field(..., min_length=1, max_length=100)
    fecha_inicio: datetime = Field(...)
    fecha_fin: datetime | None = None


class AuditoriaCreate(AuditoriaBase):
    """Schema for creating Auditoria."""

    pass


class AuditoriaUpdate(BaseModel):
    """Schema for updating Auditoria (all fields optional)."""

    titulo: str | None = Field(None, min_length=1, max_length=255)
    tipo: str | None = Field(None, min_length=1, max_length=100)
    alcance: str | None = Field(None, min_length=1)
    estado: str | None = Field(None, min_length=1, max_length=100)
    fecha_inicio: datetime | None = None
    fecha_fin: datetime | None = None


class AuditoriaRead(AuditoriaBase):
    """Schema for reading Auditoria."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
