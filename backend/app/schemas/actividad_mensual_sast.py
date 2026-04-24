"""ActividadMensualSast schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ActividadMensualSastBase(BaseModel):
    programa_sast_id: UUID
    mes: int = Field(..., ge=1, le=12)
    ano: int = Field(..., ge=2000, le=2100)
    total_hallazgos: Optional[int] = Field(None, ge=0)
    criticos: Optional[int] = Field(None, ge=0)
    altos: Optional[int] = Field(None, ge=0)
    medios: Optional[int] = Field(None, ge=0)
    bajos: Optional[int] = Field(None, ge=0)
    score: Optional[float] = Field(None, ge=0.0, le=100.0)
    notas: Optional[str] = None


class ActividadMensualSastCreate(ActividadMensualSastBase):
    """Fields required to create a actividad_mensual_sast. user_id is set from auth context."""
    pass


class ActividadMensualSastUpdate(BaseModel):
    """All fields optional for partial updates."""
    mes: Optional[int] = Field(None, ge=1, le=12)
    ano: Optional[int] = Field(None, ge=2000, le=2100)
    total_hallazgos: Optional[int] = Field(None, ge=0)
    criticos: Optional[int] = Field(None, ge=0)
    altos: Optional[int] = Field(None, ge=0)
    medios: Optional[int] = Field(None, ge=0)
    bajos: Optional[int] = Field(None, ge=0)
    score: Optional[float] = Field(None, ge=0.0, le=100.0)
    notas: Optional[str] = None


class ActividadMensualSastRead(ActividadMensualSastBase):
    """Full actividad_mensual_sast representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
