"""Auditoria schema — audit record."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class AuditoriaBase(BaseModel):
    """Base schema for Auditoria."""

    titulo: str = Field(..., min_length=1, max_length=255)
    tipo: str = Field(..., min_length=1, max_length=100)
    alcance: str = Field(..., min_length=1)
    fecha_inicio: datetime = Field(...)
    fecha_fin: Optional[datetime] = None


class AuditoriaCreate(AuditoriaBase):
    """Schema for creating Auditoria."""

    pass


class AuditoriaUpdate(BaseModel):
    """Schema for updating Auditoria (all fields optional)."""

    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    tipo: Optional[str] = Field(None, min_length=1, max_length=100)
    alcance: Optional[str] = Field(None, min_length=1)
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None


class AuditoriaRead(AuditoriaBase):
    """Schema for reading Auditoria."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
