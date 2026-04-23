"""Subdireccion schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SubdireccionBase(BaseModel):
    nombre: str
    codigo: str
    descripcion: Optional[str] = None


class SubdireccionCreate(SubdireccionBase):
    """Fields required to create a subdireccion. user_id is set from auth context."""
    pass


class SubdireccionUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: Optional[str] = None
    codigo: Optional[str] = None
    descripcion: Optional[str] = None


class SubdireccionRead(SubdireccionBase):
    """Full subdireccion representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
