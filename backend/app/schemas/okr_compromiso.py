"""OkrCompromiso schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OkrCompromisoBase(BaseModel):
    plan_id: UUID
    categoria_id: UUID | None = None
    nombre_objetivo: str
    descripcion: str | None = None
    peso_global: float = Field(ge=0, le=100)
    fecha_inicio: datetime
    fecha_fin: datetime
    tipo_medicion: str


class OkrCompromisoCreate(OkrCompromisoBase):
    """Fields required to create a okr_compromiso. user_id is set from auth context."""
    pass


class OkrCompromisoUpdate(BaseModel):
    """All fields optional for partial updates."""
    plan_id: UUID | None = None
    categoria_id: UUID | None = None
    nombre_objetivo: str | None = None
    descripcion: str | None = None
    peso_global: float | None = Field(default=None, ge=0, le=100)
    fecha_inicio: datetime | None = None
    fecha_fin: datetime | None = None
    tipo_medicion: str | None = None


class OkrCompromisoRead(OkrCompromisoBase):
    """Full okr_compromiso representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
