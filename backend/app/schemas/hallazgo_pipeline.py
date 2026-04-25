"""HallazgoPipeline schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

SEVERIDADES_VALIDAS = ["Critica", "Alta", "Media", "Baja"]

ESTADOS_VALIDOS = [
    "Abierto",
    "Falso Positivo",
    "Aceptado",
    "Remediado",
]


class HallazgoPipelineBase(BaseModel):
    pipeline_release_id: UUID
    vulnerabilidad_id: UUID | None = None
    titulo: str
    descripcion: str | None = None
    severidad: str
    archivo: str | None = None
    linea: int | None = None
    regla: str | None = None
    estado: str = "Abierto"

    @field_validator("severidad")
    @classmethod
    def validate_severidad(cls, v: str) -> str:
        if v not in SEVERIDADES_VALIDAS:
            raise ValueError(f"severidad '{v}' inválida. Valores permitidos: {SEVERIDADES_VALIDAS}")
        return v

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str) -> str:
        if v not in ESTADOS_VALIDOS:
            raise ValueError(f"estado '{v}' inválido. Valores permitidos: {ESTADOS_VALIDOS}")
        return v


class HallazgoPipelineCreate(HallazgoPipelineBase):
    """Fields required to create a hallazgo_pipeline. user_id is set from auth context."""

    pass


class HallazgoPipelineUpdate(BaseModel):
    """All fields optional for partial updates."""

    vulnerabilidad_id: UUID | None = None
    titulo: str | None = None
    descripcion: str | None = None
    severidad: str | None = None
    archivo: str | None = None
    linea: int | None = None
    regla: str | None = None
    estado: str | None = None

    @field_validator("severidad")
    @classmethod
    def validate_severidad(cls, v: str | None) -> str | None:
        if v is not None and v not in SEVERIDADES_VALIDAS:
            raise ValueError(f"severidad '{v}' inválida. Valores permitidos: {SEVERIDADES_VALIDAS}")
        return v

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str | None) -> str | None:
        if v is not None and v not in ESTADOS_VALIDOS:
            raise ValueError(f"estado '{v}' inválido. Valores permitidos: {ESTADOS_VALIDOS}")
        return v


class HallazgoPipelineRead(HallazgoPipelineBase):
    """Full hallazgo_pipeline representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
