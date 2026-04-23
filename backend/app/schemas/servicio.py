"""Servicio schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class ServicioBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    criticidad: str
    tecnologia_stack: Optional[str] = None
    celula_id: UUID


class ServicioCreate(ServicioBase):
    """Fields required to create a servicio. user_id is set from auth context."""
    pass


class ServicioUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    criticidad: Optional[str] = None
    tecnologia_stack: Optional[str] = None
    celula_id: Optional[UUID] = None


class ServicioRead(ServicioBase):
    """Full servicio representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
