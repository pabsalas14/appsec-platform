"""SesionThreatModeling schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ESTADOS_SESION = {"Planificada", "En Progreso", "Completada", "Cancelada"}


class SesionThreatModelingBase(BaseModel):
    programa_tm_id: UUID
    fecha: datetime
    participantes: Optional[str] = None
    contexto: Optional[str] = None
    estado: str = Field(..., description="Planificada | En Progreso | Completada | Cancelada")
    ia_utilizada: bool = False

    def model_post_init(self, __context) -> None:
        if self.estado not in ESTADOS_SESION:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_SESION)}")


class SesionThreatModelingCreate(SesionThreatModelingBase):
    """Fields required to create a sesion_threat_modeling. user_id is set from auth context."""
    pass


class SesionThreatModelingUpdate(BaseModel):
    """All fields optional for partial updates."""
    fecha: Optional[datetime] = None
    participantes: Optional[str] = None
    contexto: Optional[str] = None
    estado: Optional[str] = None
    ia_utilizada: Optional[bool] = None

    def model_post_init(self, __context) -> None:
        if self.estado is not None and self.estado not in ESTADOS_SESION:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_SESION)}")


class SesionThreatModelingRead(SesionThreatModelingBase):
    """Full sesion_threat_modeling representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
