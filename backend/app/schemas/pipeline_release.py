"""PipelineRelease schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

TIPOS_VALIDOS = ["SAST", "DAST", "SCA"]

RESULTADOS_VALIDOS = [
    "Pendiente",
    "En Progreso",
    "Exitoso",
    "Fallido",
    "Cancelado",
]


class PipelineReleaseBase(BaseModel):
    service_release_id: Optional[UUID] = None
    repositorio_id: UUID
    rama: str
    commit_sha: Optional[str] = None
    tipo: str
    resultado: str = "Pendiente"
    herramienta: Optional[str] = None

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: str) -> str:
        if v not in TIPOS_VALIDOS:
            raise ValueError(
                f"tipo '{v}' inválido. Valores permitidos: {TIPOS_VALIDOS}"
            )
        return v

    @field_validator("resultado")
    @classmethod
    def validate_resultado(cls, v: str) -> str:
        if v not in RESULTADOS_VALIDOS:
            raise ValueError(
                f"resultado '{v}' inválido. Valores permitidos: {RESULTADOS_VALIDOS}"
            )
        return v


class PipelineReleaseCreate(PipelineReleaseBase):
    """Fields required to create a pipeline_release. user_id is set from auth context."""
    pass


class PipelineReleaseUpdate(BaseModel):
    """All fields optional for partial updates."""
    rama: Optional[str] = None
    commit_sha: Optional[str] = None
    resultado: Optional[str] = None
    herramienta: Optional[str] = None

    @field_validator("resultado")
    @classmethod
    def validate_resultado(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in RESULTADOS_VALIDOS:
            raise ValueError(
                f"resultado '{v}' inválido. Valores permitidos: {RESULTADOS_VALIDOS}"
            )
        return v


class PipelineReleaseRead(PipelineReleaseBase):
    """Full pipeline_release representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
