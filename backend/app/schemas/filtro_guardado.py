"""FiltroGuardado schema — saved filters."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FiltroGuardadoBase(BaseModel):
    """Base schema for FiltroGuardado."""

    nombre: str = Field(..., min_length=1, max_length=255)
    modulo: str = Field(..., min_length=1, max_length=100)
    parametros: dict[str, Any] = Field(...)
    compartido: bool = Field(default=False)


class FiltroGuardadoCreate(FiltroGuardadoBase):
    """Schema for creating FiltroGuardado."""

    pass


class FiltroGuardadoUpdate(BaseModel):
    """Schema for updating FiltroGuardado (all fields optional)."""

    nombre: str | None = Field(None, min_length=1, max_length=255)
    modulo: str | None = Field(None, min_length=1, max_length=100)
    parametros: dict[str, Any] | None = None
    compartido: bool | None = None


class FiltroGuardadoRead(FiltroGuardadoBase):
    """Schema for reading FiltroGuardado."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    usuario_id: UUID
    created_at: datetime
    updated_at: datetime
