"""ProgramaThreatModeling schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

ESTADOS_PROGRAMA = {"Activo", "Inactivo", "Completado", "Cancelado"}


class ProgramaThreatModelingBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=255)
    ano: int = Field(..., ge=2000, le=2100)
    descripcion: str | None = None
    activo_web_id: UUID | None = None
    servicio_id: UUID | None = None
    estado: str = Field(..., description="Activo | Inactivo | Completado | Cancelado")

    @model_validator(mode="after")
    def validate_activo(self) -> "ProgramaThreatModelingBase":
        if self.activo_web_id is None and self.servicio_id is None:
            raise ValueError("Debe especificar activo_web_id o servicio_id")
        return self

    def model_post_init(self, __context) -> None:
        if self.estado not in ESTADOS_PROGRAMA:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_PROGRAMA)}")


class ProgramaThreatModelingCreate(ProgramaThreatModelingBase):
    """Fields required to create a programa_threat_modeling. user_id is set from auth context."""
    pass


class ProgramaThreatModelingUpdate(BaseModel):
    """All fields optional for partial updates."""
    nombre: str | None = Field(None, min_length=1, max_length=255)
    ano: int | None = Field(None, ge=2000, le=2100)
    descripcion: str | None = None
    activo_web_id: UUID | None = None
    servicio_id: UUID | None = None
    estado: str | None = None

    def model_post_init(self, __context) -> None:
        if self.estado is not None and self.estado not in ESTADOS_PROGRAMA:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_PROGRAMA)}")


class ProgramaThreatModelingRead(ProgramaThreatModelingBase):
    """Full programa_threat_modeling representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
