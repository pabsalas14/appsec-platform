"""ControlMitigacion schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

TIPOS_CONTROL = {"Preventivo", "Detectivo", "Correctivo", "Disuasivo"}
ESTADOS_CONTROL = {"Pendiente", "Implementado", "En Progreso", "Descartado"}


class ControlMitigacionBase(BaseModel):
    amenaza_id: UUID
    nombre: str = Field(..., min_length=1, max_length=255)
    descripcion: str | None = None
    tipo: str = Field(..., description="Preventivo | Detectivo | Correctivo | Disuasivo")
    estado: str = Field(..., description="Pendiente | Implementado | En Progreso | Descartado")
    responsable_id: UUID | None = None

    def model_post_init(self, __context) -> None:
        if self.tipo not in TIPOS_CONTROL:
            raise ValueError(f"tipo debe ser uno de {sorted(TIPOS_CONTROL)}")
        if self.estado not in ESTADOS_CONTROL:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_CONTROL)}")


class ControlMitigacionCreate(ControlMitigacionBase):
    """Fields required to create a control_mitigacion. user_id is set from auth context."""
    pass


class ControlMitigacionUpdate(BaseModel):
    """All fields optional for partial updates."""
    nombre: str | None = Field(None, min_length=1, max_length=255)
    descripcion: str | None = None
    tipo: str | None = None
    estado: str | None = None
    responsable_id: UUID | None = None

    def model_post_init(self, __context) -> None:
        if self.tipo is not None and self.tipo not in TIPOS_CONTROL:
            raise ValueError(f"tipo debe ser uno de {sorted(TIPOS_CONTROL)}")
        if self.estado is not None and self.estado not in ESTADOS_CONTROL:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_CONTROL)}")


class ControlMitigacionRead(ControlMitigacionBase):
    """Full control_mitigacion representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
