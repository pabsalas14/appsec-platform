"""TemaEmergente schema — emerging security topic."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TemaEmergenteBase(BaseModel):
    """Base schema for TemaEmergente."""

    titulo: str = Field(..., min_length=1, max_length=255)
    descripcion: str = Field(..., min_length=1)
    tipo: str = Field(..., min_length=1, max_length=100)
    impacto: str = Field(..., min_length=1, max_length=50)
    estado: str = Field(..., min_length=1, max_length=100)
    fuente: str = Field(..., min_length=1, max_length=255)
    celula_id: UUID | None = None


class TemaEmergenteCreate(TemaEmergenteBase):
    """Schema for creating TemaEmergente."""

    pass


class TemaEmergenteUpdate(BaseModel):
    """Schema for updating TemaEmergente (all fields optional)."""

    titulo: str | None = Field(None, min_length=1, max_length=255)
    descripcion: str | None = Field(None, min_length=1)
    tipo: str | None = Field(None, min_length=1, max_length=100)
    impacto: str | None = Field(None, min_length=1, max_length=50)
    estado: str | None = Field(None, min_length=1, max_length=100)
    fuente: str | None = Field(None, min_length=1, max_length=255)
    celula_id: UUID | None = None


class TemaEmergenteRead(TemaEmergenteBase):
    """Schema for reading TemaEmergente."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    celula_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
