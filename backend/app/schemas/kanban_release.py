"""Kanban Release schemas — Pydantic v2."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class KanbanColumnBase(BaseModel):
    """Base schema for Kanban column configuration."""

    nombre: str
    color: str = "#3b82f6"
    icono: str | None = None
    orden: int = 0
    estado_correspondiente: str | None = None
    descripcion: str | None = None


class KanbanColumnCreate(KanbanColumnBase):
    """Create a kanban column."""

    pass


class KanbanColumnUpdate(BaseModel):
    """Update a kanban column."""

    nombre: str | None = None
    color: str | None = None
    icono: str | None = None
    orden: int | None = None
    estado_correspondiente: str | None = None
    descripcion: str | None = None


class KanbanColumnRead(KanbanColumnBase):
    """Kanban column representation."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class ReleaseKanbanMove(BaseModel):
    """Move a release to a new column."""

    column_id: UUID
    nueva_etapa: str | None = None
    notas: str | None = None


class ReleaseKanbanData(BaseModel):
    """Individual release in kanban."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    version: str
    estado_actual: str
    servicio_id: UUID
    servicio_nombre: str | None = None
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    fecha_entrada: datetime | None = None
    etapas_count: int = 0
    etapas_completadas: int = 0


class ReleaseKanbanColumn(BaseModel):
    """Column with releases data."""

    id: UUID
    nombre: str
    color: str
    estado_correspondiente: str
    releases: list[ReleaseKanbanData]
    release_count: int
    orden: int


class ReleaseKanbanBoard(BaseModel):
    """Complete kanban board data."""

    columnas: list[ReleaseKanbanColumn]
    total_releases: int
    metadata: dict[str, Any] = {}
