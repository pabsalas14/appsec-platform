"""ProgramaDast schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ESTADOS_PROGRAMA = {"Activo", "Inactivo", "Completado", "Cancelado"}


class ProgramaDastBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=255)
    ano: int = Field(..., ge=2000, le=2100)
    descripcion: Optional[str] = None
    activo_web_id: UUID
    estado: str = Field(..., description="Activo | Inactivo | Completado | Cancelado")

    def model_post_init(self, __context) -> None:
        if self.estado not in ESTADOS_PROGRAMA:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_PROGRAMA)}")


class ProgramaDastCreate(ProgramaDastBase):
    """Fields required to create a programa_dast. user_id is set from auth context."""
    pass


class ProgramaDastUpdate(BaseModel):
    """All fields optional for partial updates."""
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    ano: Optional[int] = Field(None, ge=2000, le=2100)
    descripcion: Optional[str] = None
    activo_web_id: Optional[UUID] = None
    estado: Optional[str] = None

    def model_post_init(self, __context) -> None:
        if self.estado is not None and self.estado not in ESTADOS_PROGRAMA:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_PROGRAMA)}")


class ProgramaDastRead(ProgramaDastBase):
    """Full programa_dast representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
