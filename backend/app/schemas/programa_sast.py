"""ProgramaSast schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ESTADOS_PROGRAMA = {"Activo", "Inactivo", "Completado", "Cancelado"}


class ProgramaSastBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=255)
    ano: int = Field(..., ge=2000, le=2100)
    descripcion: str | None = None
    repositorio_id: UUID
    estado: str = Field(..., description="Activo | Inactivo | Completado | Cancelado")

    def model_post_init(self, __context) -> None:
        if self.estado not in ESTADOS_PROGRAMA:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_PROGRAMA)}")


class ProgramaSastCreate(ProgramaSastBase):
    """Fields required to create a programa_sast. user_id is set from auth context."""
    pass


class ProgramaSastUpdate(BaseModel):
    """All fields optional for partial updates."""
    nombre: str | None = Field(None, min_length=1, max_length=255)
    ano: int | None = Field(None, ge=2000, le=2100)
    descripcion: str | None = None
    repositorio_id: UUID | None = None
    estado: str | None = None

    def model_post_init(self, __context) -> None:
        if self.estado is not None and self.estado not in ESTADOS_PROGRAMA:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_PROGRAMA)}")


class ProgramaSastRead(ProgramaSastBase):
    """Full programa_sast representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
