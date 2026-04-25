"""EvidenciaRemediacion schemas — Pydantic v2.

El sha256 se calcula en el servicio al momento del upload (A3).
No se expone en Create — se calcula automáticamente.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EvidenciaRemediacionBase(BaseModel):
    vulnerabilidad_id: UUID
    descripcion: str = Field(..., min_length=3)
    filename: str | None = Field(None, max_length=255)
    content_type: str | None = Field(None, max_length=128)
    # sha256 es read-only desde la API (calculado en service, A3)
    sha256: str | None = Field(None, max_length=64)
    file_size: int | None = Field(None, ge=0)


class EvidenciaRemediacionCreate(BaseModel):
    """Campos para registrar evidencia. user_id se toma del contexto de auth.
    sha256 y file_size se calculan en el service al procesar el archivo.
    """

    vulnerabilidad_id: UUID
    descripcion: str = Field(..., min_length=3)
    filename: str | None = Field(None, max_length=255)
    content_type: str | None = Field(None, max_length=128)
    # sha256 puede venir pre-calculado por el cliente o lo calcula el service
    sha256: str | None = Field(None, max_length=64)
    file_size: int | None = Field(None, ge=0)


class EvidenciaRemediacionUpdate(BaseModel):
    """Solo descripción es actualizable — el archivo y hash son inmutables."""

    descripcion: str | None = Field(None, min_length=3)


class EvidenciaRemediacionRead(EvidenciaRemediacionBase):
    """Representación completa retornada por la API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
