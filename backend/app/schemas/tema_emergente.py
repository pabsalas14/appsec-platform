"""TemaEmergente schema — emerging security topic."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class TemaEmergenteBase(BaseModel):
    """Base schema for TemaEmergente."""

    titulo: str = Field(..., min_length=1, max_length=255)
    descripcion: str = Field(..., min_length=1)
    tipo: str = Field(..., min_length=1, max_length=100)
    impacto: str = Field(..., min_length=1, max_length=50)
    estado: str = Field(..., min_length=1, max_length=100)
    fuente: str = Field(..., min_length=1, max_length=255)


class TemaEmergenteCreate(TemaEmergenteBase):
    """Schema for creating TemaEmergente."""

    pass


class TemaEmergenteUpdate(BaseModel):
    """Schema for updating TemaEmergente (all fields optional)."""

    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    descripcion: Optional[str] = Field(None, min_length=1)
    tipo: Optional[str] = Field(None, min_length=1, max_length=100)
    impacto: Optional[str] = Field(None, min_length=1, max_length=50)
    estado: Optional[str] = Field(None, min_length=1, max_length=100)
    fuente: Optional[str] = Field(None, min_length=1, max_length=255)


class TemaEmergenteRead(TemaEmergenteBase):
    """Schema for reading TemaEmergente."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
