"""Gerencia schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class GerenciaBase(BaseModel):
    """Base schema for Gerencia."""

    nombre: str
    subdireccion_id: UUID
    descripcion: str | None = None


class GerenciaCreate(GerenciaBase):
    """Fields required to create a gerencia. user_id is set from auth context."""
    pass


class GerenciaUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: str | None = None
    subdireccion_id: UUID | None = None
    descripcion: str | None = None


class GerenciaRead(GerenciaBase):
    """Full gerencia representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
