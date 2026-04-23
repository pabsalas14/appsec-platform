"""Celula schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CelulaBase(BaseModel):
    nombre: str
    tipo: str
    descripcion: Optional[str] = None
    subdireccion_id: UUID


class CelulaCreate(CelulaBase):
    """Fields required to create a celula. user_id is set from auth context."""
    pass


class CelulaUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: Optional[str] = None
    tipo: Optional[str] = None
    descripcion: Optional[str] = None
    subdireccion_id: Optional[UUID] = None


class CelulaRead(CelulaBase):
    """Full celula representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
