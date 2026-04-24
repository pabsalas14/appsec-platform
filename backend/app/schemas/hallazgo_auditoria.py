"""HallazgoAuditoria schema — audit finding."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class HallazgoAuditoriaBase(BaseModel):
    """Base schema for HallazgoAuditoria."""

    titulo: str = Field(..., min_length=1, max_length=255)
    descripcion: str = Field(..., min_length=1)
    severidad: str = Field(..., min_length=1, max_length=50)
    auditoria_id: UUID = Field(...)
    categoria: str = Field(default="General", min_length=1, max_length=100)
    estado: str = Field(default="Abierto", min_length=1, max_length=100)


class HallazgoAuditoriaCreate(HallazgoAuditoriaBase):
    """Schema for creating HallazgoAuditoria."""

    pass


class HallazgoAuditoriaUpdate(BaseModel):
    """Schema for updating HallazgoAuditoria (all fields optional)."""

    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    descripcion: Optional[str] = Field(None, min_length=1)
    severidad: Optional[str] = Field(None, min_length=1, max_length=50)
    categoria: Optional[str] = Field(None, min_length=1, max_length=100)
    estado: Optional[str] = Field(None, min_length=1, max_length=100)


class HallazgoAuditoriaRead(HallazgoAuditoriaBase):
    """Schema for reading HallazgoAuditoria."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
