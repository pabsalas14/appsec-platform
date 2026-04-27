"""OkrSubcompromiso schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OkrSubcompromisoBase(BaseModel):
    compromiso_id: UUID
    nombre_sub_item: str
    resultado_esperado: Optional[str] = None
    peso_interno: float = Field(ge=0, le=100)
    evidencia_requerida: bool


class OkrSubcompromisoCreate(OkrSubcompromisoBase):
    """Fields required to create a okr_subcompromiso. user_id is set from auth context."""
    pass


class OkrSubcompromisoUpdate(BaseModel):
    """All fields optional for partial updates."""
    compromiso_id: Optional[UUID] = None
    nombre_sub_item: Optional[str] = None
    resultado_esperado: Optional[str] = None
    peso_interno: Optional[float] = Field(default=None, ge=0, le=100)
    evidencia_requerida: Optional[bool] = None


class OkrSubcompromisoRead(OkrSubcompromisoBase):
    """Full okr_subcompromiso representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
