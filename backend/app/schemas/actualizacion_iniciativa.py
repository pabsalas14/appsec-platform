"""ActualizacionIniciativa schema — update log for initiative."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class ActualizacionIniciativaBase(BaseModel):
    """Base schema for ActualizacionIniciativa."""

    titulo: str = Field(..., min_length=1, max_length=255)
    contenido: str = Field(..., min_length=1)
    iniciativa_id: UUID = Field(...)


class ActualizacionIniciativaCreate(ActualizacionIniciativaBase):
    """Schema for creating ActualizacionIniciativa."""

    pass


class ActualizacionIniciativaUpdate(BaseModel):
    """Schema for updating ActualizacionIniciativa (all fields optional)."""

    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    contenido: Optional[str] = Field(None, min_length=1)


class ActualizacionIniciativaRead(ActualizacionIniciativaBase):
    """Schema for reading ActualizacionIniciativa."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
