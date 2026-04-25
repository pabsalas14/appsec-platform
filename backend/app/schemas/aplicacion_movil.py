"""AplicacionMovil schemas — Pydantic v2."""

from datetime import datetime
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

    nombre: str | None = None
    plataforma: str | None = None
    bundle_id: str | None = None
    celula_id: UUID | None = None


class AplicacionMovilRead(AplicacionMovilBase):
    """Full aplicacion_movil representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
