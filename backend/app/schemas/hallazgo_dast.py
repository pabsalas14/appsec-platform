"""HallazgoDast schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

SEVERIDADES = {"Critica", "Alta", "Media", "Baja"}
ESTADOS_HALLAZGO = {"Abierto", "Cerrado", "Falso Positivo", "Aceptado", "En Remediacion"}


class HallazgoDastBase(BaseModel):
    ejecucion_dast_id: UUID
    vulnerabilidad_id: Optional[UUID] = None
    titulo: str = Field(..., min_length=1, max_length=255)
    descripcion: Optional[str] = None
    severidad: str = Field(..., description="Critica | Alta | Media | Baja")
    url: Optional[str] = Field(None, max_length=500)
    parametro: Optional[str] = Field(None, max_length=255)
    estado: str = Field(..., description="Abierto | Cerrado | Falso Positivo | Aceptado | En Remediacion")

    def model_post_init(self, __context) -> None:
        if self.severidad not in SEVERIDADES:
            raise ValueError(f"severidad debe ser uno de {sorted(SEVERIDADES)}")
        if self.estado not in ESTADOS_HALLAZGO:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_HALLAZGO)}")


class HallazgoDastCreate(HallazgoDastBase):
    """Fields required to create a hallazgo_dast. user_id is set from auth context."""
    pass


class HallazgoDastUpdate(BaseModel):
    """All fields optional for partial updates."""
    vulnerabilidad_id: Optional[UUID] = None
    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    descripcion: Optional[str] = None
    severidad: Optional[str] = None
    url: Optional[str] = Field(None, max_length=500)
    parametro: Optional[str] = Field(None, max_length=255)
    estado: Optional[str] = None

    def model_post_init(self, __context) -> None:
        if self.severidad is not None and self.severidad not in SEVERIDADES:
            raise ValueError(f"severidad debe ser uno de {sorted(SEVERIDADES)}")
        if self.estado is not None and self.estado not in ESTADOS_HALLAZGO:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_HALLAZGO)}")


class HallazgoDastRead(HallazgoDastBase):
    """Full hallazgo_dast representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
