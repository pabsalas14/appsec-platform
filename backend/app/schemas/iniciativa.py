"""Iniciativa schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class IniciativaBase(BaseModel):
    """Base schema for Iniciativa."""

    titulo: str
    descripcion: Optional[str] = None
    tipo: str
    estado: str
    fecha_inicio: Optional[datetime] = None
    fecha_fin_estimada: Optional[datetime] = None


class IniciativaCreate(IniciativaBase):
    """Fields required to create a iniciativa. user_id is set from auth context."""
    pass


class IniciativaUpdate(BaseModel):
    """All fields optional for partial updates."""

    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    estado: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin_estimada: Optional[datetime] = None


class IniciativaRead(IniciativaBase):
    """Full iniciativa representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
