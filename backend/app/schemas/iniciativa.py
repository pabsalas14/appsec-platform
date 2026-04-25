"""Iniciativa schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class IniciativaBase(BaseModel):
    """Base schema for Iniciativa."""

    titulo: str
    descripcion: str | None = None
    tipo: str
    estado: str
    celula_id: UUID | None = None
    fecha_inicio: datetime | None = None
    fecha_fin_estimada: datetime | None = None


class IniciativaCreate(IniciativaBase):
    """Fields required to create a iniciativa. user_id is set from auth context."""

    pass


class IniciativaUpdate(BaseModel):
    """All fields optional for partial updates."""

    titulo: str | None = None
    descripcion: str | None = None
    tipo: str | None = None
    estado: str | None = None
    celula_id: UUID | None = None
    fecha_inicio: datetime | None = None
    fecha_fin_estimada: datetime | None = None


class IniciativaRead(IniciativaBase):
    """Full iniciativa representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    celula_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
