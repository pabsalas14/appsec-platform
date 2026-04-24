"""Gerencia schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class GerenciaBase(BaseModel):
nombre: str
subdireccion_id: uuid.UUID
descripcion: str


class GerenciaCreate(GerenciaBase):
    """Fields required to create a gerencia. user_id is set from auth context."""
    pass


class GerenciaUpdate(BaseModel):
    """All fields optional for partial updates."""
nombre: Optional[str] = None
subdireccion_id: Optional[uuid.UUID] = None
descripcion: Optional[str] = None


class GerenciaRead(GerenciaBase):
    """Full gerencia representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
