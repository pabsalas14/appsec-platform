"""Celula schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CelulaBase(BaseModel):
    nombre: str
    tipo: str
    descripcion: str | None = None
    organizacion_id: UUID


class CelulaCreate(CelulaBase):
    """Fields required to create a celula. user_id is set from auth context."""

    pass


class CelulaUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: str | None = None
    tipo: str | None = None
    descripcion: str | None = None
    organizacion_id: UUID | None = None


class CelulaRead(CelulaBase):
    """Full celula representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
