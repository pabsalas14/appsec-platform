"""ServiceRelease schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

ESTADOS_VALIDOS = [
    "Borrador",
    "En Revision de Diseno",
    "En Validacion de Seguridad",
    "En Pruebas de Seguridad",
    "Pendiente de Aprobacion",
    "En QA",
    "En Produccion",
    "Rechazado",
    "Cancelado",
]


class ServiceReleaseBase(BaseModel):
    nombre: str
    version: str
    descripcion: str | None = None
    servicio_id: UUID
    estado_actual: str = "Borrador"
    jira_referencia: str | None = None

    @field_validator("estado_actual")
    @classmethod
    def validate_estado(cls, v: str) -> str:
        if v not in ESTADOS_VALIDOS:
            raise ValueError(f"estado_actual '{v}' inválido. Valores permitidos: {ESTADOS_VALIDOS}")
        return v


class ServiceReleaseCreate(ServiceReleaseBase):
    """Fields required to create a service_release. user_id is set from auth context."""

    pass


class ServiceReleaseUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: str | None = None
    version: str | None = None
    descripcion: str | None = None
    estado_actual: str | None = None
    jira_referencia: str | None = None

    @field_validator("estado_actual")
    @classmethod
    def validate_estado(cls, v: str | None) -> str | None:
        if v is not None and v not in ESTADOS_VALIDOS:
            raise ValueError(f"estado_actual '{v}' inválido. Valores permitidos: {ESTADOS_VALIDOS}")
        return v


class ServiceReleaseRead(ServiceReleaseBase):
    """Full service_release representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
