"""HallazgoMAST schemas — finding from MAST execution (Módulo 4)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

SEVERIDADES = {"Critica", "Alta", "Media", "Baja"}


class HallazgoMASTBase(BaseModel):
    ejecucion_mast_id: UUID
    vulnerabilidad_id: UUID | None = None
    nombre: str
    descripcion: str | None = None
    severidad: str
    cwe: str | None = None
    owasp_categoria: str | None = None

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError("nombre no puede estar vacío")
        return v

    @field_validator("severidad")
    @classmethod
    def validate_severidad(cls, v: str) -> str:
        if v not in SEVERIDADES:
            raise ValueError(f"severidad debe ser uno de: {SEVERIDADES}")
        return v


class HallazgoMASTCreate(HallazgoMASTBase):
    """Fields required to create hallazgo MAST. user_id is set from auth context."""
    pass


class HallazgoMASTUpdate(BaseModel):
    """All fields optional for partial updates."""
    ejecucion_mast_id: UUID | None = None
    vulnerabilidad_id: UUID | None = None
    nombre: str | None = None
    descripcion: str | None = None
    severidad: str | None = None
    cwe: str | None = None
    owasp_categoria: str | None = None

    @field_validator("severidad")
    @classmethod
    def validate_severidad(cls, v: str | None) -> str | None:
        if v is not None and v not in SEVERIDADES:
            raise ValueError(f"severidad debe ser uno de: {SEVERIDADES}")
        return v


class HallazgoMASTRead(HallazgoMASTBase):
    """Full hallazgo MAST representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
