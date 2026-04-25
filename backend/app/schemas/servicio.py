"""Servicio schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ServicioBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    criticidad: str
    tecnologia_stack: str | None = None
    celula_id: UUID


class ServicioCreate(ServicioBase):
    """Fields required to create a servicio. user_id is set from auth context."""
    pass


class ServicioUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: str | None = None
    descripcion: str | None = None
    criticidad: str | None = None
    tecnologia_stack: str | None = None
    celula_id: UUID | None = None


class ServicioRead(ServicioBase):
    """Full servicio representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
