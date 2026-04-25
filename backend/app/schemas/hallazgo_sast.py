"""HallazgoSast schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

SEVERIDADES = {"Critica", "Alta", "Media", "Baja"}
ESTADOS_HALLAZGO = {"Abierto", "Cerrado", "Falso Positivo", "Aceptado", "En Remediacion"}


class HallazgoSastBase(BaseModel):
    actividad_sast_id: UUID
    vulnerabilidad_id: UUID | None = None
    titulo: str = Field(..., min_length=1, max_length=255)
    descripcion: str | None = None
    severidad: str = Field(..., description="Critica | Alta | Media | Baja")
    herramienta: str | None = Field(None, max_length=100)
    regla: str | None = Field(None, max_length=255)
    archivo: str | None = Field(None, max_length=500)
    linea: int | None = Field(None, ge=1)
    estado: str = Field(..., description="Abierto | Cerrado | Falso Positivo | Aceptado | En Remediacion")

    def model_post_init(self, _: dict) -> None:
        if self.severidad not in SEVERIDADES:
            raise ValueError(f"severidad debe ser uno de {sorted(SEVERIDADES)}")
        if self.estado not in ESTADOS_HALLAZGO:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_HALLAZGO)}")


class HallazgoSastCreate(HallazgoSastBase):
    """Fields required to create a hallazgo_sast. user_id is set from auth context."""

    pass


class HallazgoSastUpdate(BaseModel):
    """All fields optional for partial updates."""

    vulnerabilidad_id: UUID | None = None
    titulo: str | None = Field(None, min_length=1, max_length=255)
    descripcion: str | None = None
    severidad: str | None = None
    herramienta: str | None = Field(None, max_length=100)
    regla: str | None = Field(None, max_length=255)
    archivo: str | None = Field(None, max_length=500)
    linea: int | None = Field(None, ge=1)
    estado: str | None = None

    def model_post_init(self, _: dict) -> None:
        if self.severidad is not None and self.severidad not in SEVERIDADES:
            raise ValueError(f"severidad debe ser uno de {sorted(SEVERIDADES)}")
        if self.estado is not None and self.estado not in ESTADOS_HALLAZGO:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_HALLAZGO)}")


class HallazgoSastRead(HallazgoSastBase):
    """Full hallazgo_sast representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
