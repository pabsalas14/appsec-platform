"""EvidenciaRegulacion schemas — Pydantic v2.

sha256 almacena el hash SHA-256 del archivo de evidencia (A3).
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class EvidenciaRegulacionBase(BaseModel):
    registro_id: UUID
    control_id: Optional[UUID] = None
    descripcion: str = Field(..., min_length=1)
    filename: Optional[str] = Field(None, max_length=500)
    sha256: Optional[str] = Field(None, max_length=64, description="SHA-256 hex del archivo (A3)")
    fecha: datetime

    @field_validator("sha256")
    @classmethod
    def validate_sha256(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) != 64:
            raise ValueError("sha256 debe ser un hash SHA-256 de 64 caracteres hex")
        return v


class EvidenciaRegulacionCreate(EvidenciaRegulacionBase):
    """Fields required to create a evidencia_regulacion. user_id is set from auth context."""
    pass


class EvidenciaRegulacionUpdate(BaseModel):
    """All fields optional for partial updates."""
    control_id: Optional[UUID] = None
    descripcion: Optional[str] = Field(None, min_length=1)
    filename: Optional[str] = Field(None, max_length=500)
    sha256: Optional[str] = Field(None, max_length=64)
    fecha: Optional[datetime] = None

    @field_validator("sha256")
    @classmethod
    def validate_sha256(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) != 64:
            raise ValueError("sha256 debe ser un hash SHA-256 de 64 caracteres hex")
        return v


class EvidenciaRegulacionRead(EvidenciaRegulacionBase):
    """Full evidencia_regulacion representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
