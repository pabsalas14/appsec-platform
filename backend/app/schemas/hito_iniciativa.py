"""HitoIniciativa schema — milestone for initiative (aligned with ORM columns)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HitoIniciativaCreate(BaseModel):
    """Create payload; accepts ``nombre`` / ``fecha_objetivo`` aliases for API compatibility."""

    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    titulo: str = Field(..., min_length=1, max_length=255, alias="nombre")
    descripcion: str | None = Field(None, max_length=2000)
    estado: str = Field(default="pendiente", max_length=100)
    fecha_estimada: datetime | None = Field(default=None, alias="fecha_objetivo")
    porcentaje_completado: int | None = Field(default=None, ge=0, le=100)
    peso: int | None = Field(
        default=None,
        ge=1,
        le=10000,
        description="Peso relativo para agregar avance (opcional; si todos los hitos tienen peso, se normaliza)",
    )
    iniciativa_id: UUID


class HitoIniciativaUpdate(BaseModel):
    """Partial update."""

    model_config = ConfigDict(populate_by_name=True)

    titulo: str | None = Field(default=None, min_length=1, max_length=255, alias="nombre")
    descripcion: str | None = Field(default=None, max_length=2000)
    estado: str | None = Field(default=None, max_length=100)
    fecha_estimada: datetime | None = Field(default=None, alias="fecha_objetivo")
    porcentaje_completado: int | None = Field(default=None, ge=0, le=100)
    peso: int | None = Field(default=None, ge=1, le=10000)


class HitoIniciativaRead(BaseModel):
    """Read model; serializes ``titulo`` as ``nombre`` for existing clients."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    user_id: UUID
    iniciativa_id: UUID
    nombre: str = Field(validation_alias="titulo", serialization_alias="nombre")
    descripcion: str | None = None
    estado: str
    fecha_objetivo: datetime | None = Field(validation_alias="fecha_estimada", serialization_alias="fecha_objetivo")
    porcentaje_completado: int | None = None
    peso: int | None = None
    created_at: datetime
    updated_at: datetime
