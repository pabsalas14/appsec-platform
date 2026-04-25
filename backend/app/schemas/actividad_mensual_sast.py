"""ActividadMensualSast schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ActividadMensualSastBase(BaseModel):
    programa_sast_id: UUID
    mes: int = Field(..., ge=1, le=12)
    ano: int = Field(..., ge=2000, le=2100)
    total_hallazgos: int | None = Field(None, ge=0)
    criticos: int | None = Field(None, ge=0)
    altos: int | None = Field(None, ge=0)
    medios: int | None = Field(None, ge=0)
    bajos: int | None = Field(None, ge=0)
    score: float | None = Field(None, ge=0.0, le=100.0)
    notas: str | None = None


class ActividadMensualSastCreate(ActividadMensualSastBase):
    """Fields required to create a actividad_mensual_sast. user_id is set from auth context."""
    pass


class ActividadMensualSastUpdate(BaseModel):
    """All fields optional for partial updates."""
    mes: int | None = Field(None, ge=1, le=12)
    ano: int | None = Field(None, ge=2000, le=2100)
    total_hallazgos: int | None = Field(None, ge=0)
    criticos: int | None = Field(None, ge=0)
    altos: int | None = Field(None, ge=0)
    medios: int | None = Field(None, ge=0)
    bajos: int | None = Field(None, ge=0)
    score: float | None = Field(None, ge=0.0, le=100.0)
    notas: str | None = None


class ActividadMensualSastRead(ActividadMensualSastBase):
    """Full actividad_mensual_sast representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
