"""EtapaRelease schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

ETAPAS_VALIDAS = [
    "Design Review",
    "Security Validation",
    "Security Tests",
    "Approval",
    "QA",
    "Production",
]

ESTADOS_VALIDOS = [
    "Pendiente",
    "En Progreso",
    "Aprobada",
    "Rechazada",
]


class EtapaReleaseBase(BaseModel):
    service_release_id: UUID
    etapa: str
    estado: str = "Pendiente"
    aprobador_id: UUID | None = None
    justificacion: str | None = None
    notas: str | None = None
    fecha_completada: datetime | None = None

    @field_validator("etapa")
    @classmethod
    def validate_etapa(cls, v: str) -> str:
        if v not in ETAPAS_VALIDAS:
            raise ValueError(f"etapa '{v}' inválida. Valores permitidos: {ETAPAS_VALIDAS}")
        return v

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str) -> str:
        if v not in ESTADOS_VALIDOS:
            raise ValueError(f"estado '{v}' inválido. Valores permitidos: {ESTADOS_VALIDOS}")
        return v


class EtapaReleaseCreate(EtapaReleaseBase):
    """Fields required to create an etapa_release. user_id is set from auth context."""

    pass


class EtapaReleaseUpdate(BaseModel):
    """All fields optional for partial updates."""

    etapa: str | None = None
    estado: str | None = None
    justificacion: str | None = None
    notas: str | None = None
    fecha_completada: datetime | None = None

    @field_validator("etapa")
    @classmethod
    def validate_etapa(cls, v: str | None) -> str | None:
        if v is not None and v not in ETAPAS_VALIDAS:
            raise ValueError(f"etapa '{v}' inválida. Valores permitidos: {ETAPAS_VALIDAS}")
        return v

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str | None) -> str | None:
        if v is not None and v not in ESTADOS_VALIDOS:
            raise ValueError(f"estado '{v}' inválido. Valores permitidos: {ESTADOS_VALIDOS}")
        return v


class EtapaAprobarRequest(BaseModel):
    """Body para aprobar una etapa."""

    notas: str | None = None


class EtapaRechazarRequest(BaseModel):
    """Body para rechazar una etapa (justificación obligatoria — A1)."""

    justificacion: str = Field(..., min_length=10)
    notas: str | None = None


class EtapaReleaseRead(EtapaReleaseBase):
    """Full etapa_release representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
