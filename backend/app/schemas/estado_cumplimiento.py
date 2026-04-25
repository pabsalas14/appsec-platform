"""EstadoCumplimiento schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ESTADOS_CUMPLIMIENTO = {"Cumple", "No Cumple", "Parcial", "No Aplica"}


class EstadoCumplimientoBase(BaseModel):
    registro_id: UUID
    control_id: UUID | None = None
    estado: str = Field(..., description="Cumple | No Cumple | Parcial | No Aplica")
    porcentaje: float | None = Field(None, ge=0.0, le=100.0)
    notas: str | None = None
    fecha_evaluacion: datetime

    def model_post_init(self, _: dict) -> None:
        if self.estado not in ESTADOS_CUMPLIMIENTO:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_CUMPLIMIENTO)}")


class EstadoCumplimientoCreate(EstadoCumplimientoBase):
    """Fields required to create a estado_cumplimiento. user_id is set from auth context."""
    pass


class EstadoCumplimientoUpdate(BaseModel):
    """All fields optional for partial updates."""
    control_id: UUID | None = None
    estado: str | None = None
    porcentaje: float | None = Field(None, ge=0.0, le=100.0)
    notas: str | None = None
    fecha_evaluacion: datetime | None = None

    def model_post_init(self, _: dict) -> None:
        if self.estado is not None and self.estado not in ESTADOS_CUMPLIMIENTO:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_CUMPLIMIENTO)}")


class EstadoCumplimientoRead(EstadoCumplimientoBase):
    """Full estado_cumplimiento representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
