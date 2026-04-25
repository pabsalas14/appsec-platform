"""SesionThreatModeling schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ESTADOS_SESION = {"Planificada", "En Progreso", "Completada", "Cancelada"}


class SesionThreatModelingBase(BaseModel):
    programa_tm_id: UUID
    fecha: datetime
    participantes: str | None = None
    contexto: str | None = None
    estado: str = Field(..., description="Planificada | En Progreso | Completada | Cancelada")
    ia_utilizada: bool = False

    def model_post_init(self, _: dict) -> None:
        if self.estado not in ESTADOS_SESION:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_SESION)}")


class SesionThreatModelingCreate(SesionThreatModelingBase):
    """Fields required to create a sesion_threat_modeling. user_id is set from auth context."""
    pass


class SesionThreatModelingUpdate(BaseModel):
    """All fields optional for partial updates."""
    fecha: datetime | None = None
    participantes: str | None = None
    contexto: str | None = None
    estado: str | None = None
    ia_utilizada: bool | None = None

    def model_post_init(self, _: dict) -> None:
        if self.estado is not None and self.estado not in ESTADOS_SESION:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_SESION)}")


class SesionThreatModelingRead(SesionThreatModelingBase):
    """Full sesion_threat_modeling representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class SesionThreatModelingIASuggestRequest(BaseModel):
    """Payload for AI-assisted threat suggestions."""

    contexto_adicional: str | None = Field(default=None, max_length=4000)
    dry_run: bool = True
    crear_amenazas: bool = False


class SesionThreatModelingIASuggestRead(BaseModel):
    """Response returned by IA suggestion endpoint."""

    provider: str
    model: str
    dry_run: bool
    content: str
    suggested_threats: list[str]
    created_amenaza_ids: list[str] = []
