"""OKR Calificación schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class OkrCalificacionBase(BaseModel):
    """Base schema for OKR calificación."""

    avance: float = Field(..., ge=0, le=100, description="Porcentaje de avance (0-100)")
    comentario: str | None = Field(None, description="Comentario del evaluador")
    evidencia: str | None = Field(None, description="Evidencia de avance")


class OkrCalificacionCreate(OkrCalificacionBase):
    """Schema for creating a calificación."""

    subcompromiso_id: UUID = Field(..., description="ID del subcompromiso a calificar")
    quarter: str = Field(..., description="Quarter (Q1, Q2, Q3, Q4)")


class OkrCalificacionUpdate(BaseModel):
    """Schema for updating a calificación."""

    avance: float | None = Field(None, ge=0, le=100)
    comentario: str | None = None
    evidencia: str | None = None
    estado: str | None = Field(None, description="Estado: draft, submitted, validated")


class OkrCalificacionRead(OkrCalificacionBase):
    """Schema for reading a calificación."""

    id: UUID
    subcompromiso_id: UUID
    quarter: str
    estado: str
    user_id: UUID
    avance_validado: float | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OkrCalificacionDrilldown(BaseModel):
    """Schema for drill-down data."""

    compromiso_id: UUID
    compromiso_nombre: str
    subcompromiso_id: UUID
    subcompromiso_nombre: str
    avance: float
    quarter: str
    estado: str
    responsable: str | None = None
