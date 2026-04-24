"""ActualizacionTema schema — update log for emerging topic."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class ActualizacionTemaBase(BaseModel):
    """Base schema for ActualizacionTema."""

    titulo: str = Field(..., min_length=1, max_length=255)
    contenido: str = Field(..., min_length=1)
    fuente: Optional[str] = Field(None, max_length=255)
    tema_id: UUID = Field(...)


class ActualizacionTemaCreate(ActualizacionTemaBase):
    """Schema for creating ActualizacionTema."""

    pass


class ActualizacionTemaUpdate(BaseModel):
    """Schema for updating ActualizacionTema (all fields optional)."""

    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    contenido: Optional[str] = Field(None, min_length=1)
    fuente: Optional[str] = Field(None, max_length=255)


class ActualizacionTemaRead(ActualizacionTemaBase):
    """Schema for reading ActualizacionTema."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
