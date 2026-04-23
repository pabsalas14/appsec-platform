"""HallazgoTercero schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

SEVERIDADES_VALIDAS = ["Critica", "Alta", "Media", "Baja"]

ESTADOS_VALIDOS = [
    "Abierto",
    "Falso Positivo",
    "Aceptado",
    "Remediado",
]


class HallazgoTerceroBase(BaseModel):
    revision_tercero_id: UUID
    vulnerabilidad_id: Optional[UUID] = None
    titulo: str
    descripcion: Optional[str] = None
    severidad: str
    cvss_score: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    cwe_id: Optional[str] = None
    estado: str = "Abierto"

    @field_validator("severidad")
    @classmethod
    def validate_severidad(cls, v: str) -> str:
        if v not in SEVERIDADES_VALIDAS:
            raise ValueError(
                f"severidad '{v}' inválida. Valores permitidos: {SEVERIDADES_VALIDAS}"
            )
        return v

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str) -> str:
        if v not in ESTADOS_VALIDOS:
            raise ValueError(
                f"estado '{v}' inválido. Valores permitidos: {ESTADOS_VALIDOS}"
            )
        return v


class HallazgoTerceroCreate(HallazgoTerceroBase):
    """Fields required to create a hallazgo_tercero. user_id is set from auth context."""
    pass


class HallazgoTerceroUpdate(BaseModel):
    """All fields optional for partial updates."""
    vulnerabilidad_id: Optional[UUID] = None
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    severidad: Optional[str] = None
    cvss_score: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    cwe_id: Optional[str] = None
    estado: Optional[str] = None

    @field_validator("severidad")
    @classmethod
    def validate_severidad(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in SEVERIDADES_VALIDAS:
            raise ValueError(
                f"severidad '{v}' inválida. Valores permitidos: {SEVERIDADES_VALIDAS}"
            )
        return v

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ESTADOS_VALIDOS:
            raise ValueError(
                f"estado '{v}' inválido. Valores permitidos: {ESTADOS_VALIDOS}"
            )
        return v


class HallazgoTerceroRead(HallazgoTerceroBase):
    """Full hallazgo_tercero representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
