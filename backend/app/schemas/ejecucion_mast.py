"""EjecucionMAST schemas — MAST execution for mobile app (Módulo 4)."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


AMBIENTES = {"Desarrollo", "Staging", "QA", "Produccion"}
RESULTADOS = {"Completada", "En Progreso", "Cancelada", "Error"}


class EjecucionMASTBase(BaseModel):
    aplicacion_movil_id: UUID
    ambiente: str
    fecha_inicio: datetime
    fecha_fin: datetime
    resultado: str
    url_reporte: Optional[str] = None

    @field_validator("ambiente")
    @classmethod
    def validate_ambiente(cls, v: str) -> str:
        if v not in AMBIENTES:
            raise ValueError(f"ambiente debe ser uno de: {AMBIENTES}")
        return v

    @field_validator("resultado")
    @classmethod
    def validate_resultado(cls, v: str) -> str:
        if v not in RESULTADOS:
            raise ValueError(f"resultado debe ser uno de: {RESULTADOS}")
        return v

    @field_validator("fecha_fin")
    @classmethod
    def validate_fecha_fin(cls, v: datetime, info) -> datetime:
        if "fecha_inicio" in info.data and v <= info.data["fecha_inicio"]:
            raise ValueError("fecha_fin debe ser posterior a fecha_inicio")
        return v


class EjecucionMASTCreate(EjecucionMASTBase):
    """Fields required to create ejecucion MAST. user_id is set from auth context."""
    pass


class EjecucionMASTUpdate(BaseModel):
    """All fields optional for partial updates."""
    aplicacion_movil_id: Optional[UUID] = None
    ambiente: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    resultado: Optional[str] = None
    url_reporte: Optional[str] = None

    @field_validator("ambiente")
    @classmethod
    def validate_ambiente(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in AMBIENTES:
            raise ValueError(f"ambiente debe ser uno de: {AMBIENTES}")
        return v

    @field_validator("resultado")
    @classmethod
    def validate_resultado(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in RESULTADOS:
            raise ValueError(f"resultado debe ser uno de: {RESULTADOS}")
        return v


class EjecucionMASTRead(EjecucionMASTBase):
    """Full ejecucion MAST representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
