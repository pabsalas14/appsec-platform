"""OkrCategoria schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OkrCategoriaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activo: bool


class OkrCategoriaCreate(OkrCategoriaBase):
    """Fields required to create a okr_categoria. user_id is set from auth context."""
    pass


class OkrCategoriaUpdate(BaseModel):
    """All fields optional for partial updates."""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None


class OkrCategoriaRead(OkrCategoriaBase):
    """Full okr_categoria representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
