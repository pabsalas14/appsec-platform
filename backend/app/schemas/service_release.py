"""ServiceRelease schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
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
    descripcion: Optional[str] = None
    servicio_id: UUID
    estado_actual: str = "Borrador"
    jira_referencia: Optional[str] = None

    @field_validator("estado_actual")
    @classmethod
    def validate_estado(cls, v: str) -> str:
        if v not in ESTADOS_VALIDOS:
            raise ValueError(
                f"estado_actual '{v}' inválido. Valores permitidos: {ESTADOS_VALIDOS}"
            )
        return v


class ServiceReleaseCreate(ServiceReleaseBase):
    """Fields required to create a service_release. user_id is set from auth context."""
    pass


class ServiceReleaseUpdate(BaseModel):
    """All fields optional for partial updates."""
    nombre: Optional[str] = None
    version: Optional[str] = None
    descripcion: Optional[str] = None
    estado_actual: Optional[str] = None
    jira_referencia: Optional[str] = None

    @field_validator("estado_actual")
    @classmethod
    def validate_estado(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ESTADOS_VALIDOS:
            raise ValueError(
                f"estado_actual '{v}' inválido. Valores permitidos: {ESTADOS_VALIDOS}"
            )
        return v


class ServiceReleaseRead(ServiceReleaseBase):
    """Full service_release representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
