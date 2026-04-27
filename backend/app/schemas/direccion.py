"""Direccion schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DireccionBase(BaseModel):
    nombre: str
    codigo: str
    descripcion: str | None = None


class DireccionCreate(DireccionBase):
    """Fields required to create a direccion. user_id is set from auth context."""

    pass


class DireccionUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: str | None = None
    codigo: str | None = None
    descripcion: str | None = None


class DireccionRead(DireccionBase):
    """Full direccion representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
