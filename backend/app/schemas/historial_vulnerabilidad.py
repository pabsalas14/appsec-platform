"""HistorialVulnerabilidad schemas — Pydantic v2.

El historial es append-only: Create sí, Update/Delete no se exponen en la API
(el historial se crea automáticamente en el service de vulnerabilidades).
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HistorialVulnerabilidadBase(BaseModel):
    vulnerabilidad_id: UUID
    estado_anterior: str | None = Field(None, max_length=64)
    estado_nuevo: str | None = Field(None, max_length=64)
    responsable_id: UUID | None = None
    # A1: justificacion requerida en transiciones críticas (validado en router/service)
    justificacion: str | None = None
    comentario: str | None = None


class HistorialVulnerabilidadCreate(HistorialVulnerabilidadBase):
    """Campos para registrar un evento de historial. user_id se toma del contexto de auth."""

    pass


class HistorialVulnerabilidadUpdate(BaseModel):
    """Update no se expone en la API — el historial es inmutable."""

    pass


class HistorialVulnerabilidadRead(HistorialVulnerabilidadBase):
    """Representación completa del historial retornada por la API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
