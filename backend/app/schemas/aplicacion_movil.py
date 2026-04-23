"""AplicacionMovil schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AplicacionMovilBase(BaseModel):
    nombre: str
    plataforma: str
    bundle_id: str
    celula_id: UUID


class AplicacionMovilCreate(AplicacionMovilBase):
    """Fields required to create a aplicacion_movil. user_id is set from auth context."""
    pass


class AplicacionMovilUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: Optional[str] = None
    plataforma: Optional[str] = None
    bundle_id: Optional[str] = None
    celula_id: Optional[UUID] = None


class AplicacionMovilRead(AplicacionMovilBase):
    """Full aplicacion_movil representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
