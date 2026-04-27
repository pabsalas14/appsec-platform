"""CustomDashboard schemas — Pydantic v2 for Dashboard Builder (Fase 2)."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CustomDashboardBase(BaseModel):
    """Common fields for CustomDashboard."""

    nombre: str = Field(..., min_length=1, max_length=255)
    descripcion: str | None = Field(None, max_length=1000)
    layout_json: dict[str, Any] = Field(..., description="react-grid-layout config: {version, grid, widgets[]}")
    chart_type: str = Field(default="dashboard")
    is_system: bool = Field(default=False)
    is_template: bool = Field(default=False)
    orden: int = Field(default=0, ge=0)
    icono: str | None = Field(None, max_length=64)
    activo: bool = Field(default=True)


class CustomDashboardCreate(CustomDashboardBase):
    """Fields required to create a CustomDashboard."""

    pass


class CustomDashboardUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: str | None = Field(None, min_length=1, max_length=255)
    descripcion: str | None = Field(None, max_length=1000)
    layout_json: dict[str, Any] | None = None
    chart_type: str | None = None
    orden: int | None = None
    icono: str | None = Field(None, max_length=64)
    activo: bool | None = None


class CustomDashboardRead(CustomDashboardBase):
    """Full CustomDashboard representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
