"""OkrCategoria schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OkrCategoriaBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    activo: bool


class OkrCategoriaCreate(OkrCategoriaBase):
    """Fields required to create a okr_categoria. user_id is set from auth context."""
    pass


class OkrCategoriaUpdate(BaseModel):
    """All fields optional for partial updates."""
    nombre: str | None = None
    descripcion: str | None = None
    activo: bool | None = None


class OkrCategoriaRead(OkrCategoriaBase):
    """Full okr_categoria representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
