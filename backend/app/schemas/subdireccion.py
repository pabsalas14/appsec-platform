"""Subdireccion schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SubdireccionBase(BaseModel):
    direccion_id: UUID | None = None
    nombre: str
    codigo: str
    descripcion: str | None = None
    director_nombre: str | None = None
    director_contacto: str | None = None


class SubdireccionCreate(SubdireccionBase):
    """Fields required to create a subdireccion. user_id is set from auth context."""

    pass


class SubdireccionUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: str | None = None
    codigo: str | None = None
    descripcion: str | None = None
    director_nombre: str | None = None
    director_contacto: str | None = None


class SubdireccionRead(SubdireccionBase):
    """Full subdireccion representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
