"""FiltroGuardado schema — saved filters."""

from __future__ import annotations

from datetime import datetime
from typing import Optional, Any, Dict
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class FiltroGuardadoBase(BaseModel):
    """Base schema for FiltroGuardado."""

    nombre: str = Field(..., min_length=1, max_length=255)
    modulo: str = Field(..., min_length=1, max_length=100)
    parametros: Dict[str, Any] = Field(...)
    compartido: bool = Field(default=False)


class FiltroGuardadoCreate(FiltroGuardadoBase):
    """Schema for creating FiltroGuardado."""

    pass


class FiltroGuardadoUpdate(BaseModel):
    """Schema for updating FiltroGuardado (all fields optional)."""

    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    modulo: Optional[str] = Field(None, min_length=1, max_length=100)
    parametros: Optional[Dict[str, Any]] = None
    compartido: Optional[bool] = None


class FiltroGuardadoRead(FiltroGuardadoBase):
    """Schema for reading FiltroGuardado."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    usuario_id: UUID
    created_at: datetime
    updated_at: datetime
