"""Module View schemas — personalized views for modules (table, kanban, calendar, cards)."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ModuleViewBase(BaseModel):
    """Base schema for module views."""

    nombre: str = Field(..., min_length=1, max_length=255, description="View name (e.g., 'Críticas SLA Vencido')")
    module_name: str = Field(..., min_length=1, max_length=100, description="Module reference (e.g., 'vulnerabilities', 'releases')")
    tipo: str = Field(..., max_length=50, description="View type: 'table', 'kanban', 'calendar', or 'cards'")
    columns_config: dict[str, Any] = Field(default_factory=dict, description="Columns configuration (JSON)")
    filters: dict[str, Any] = Field(default_factory=dict, description="Filters (JSON)")
    sort_by: dict[str, Any] = Field(default_factory=dict, description="Sort configuration (JSON)")
    group_by: str | None = Field(default=None, max_length=100, description="Optional group by field")
    page_size: int = Field(default=25, ge=5, le=100, description="Page size for pagination")


class ModuleViewCreate(ModuleViewBase):
    """Schema for creating a new module view."""

    pass


class ModuleViewUpdate(BaseModel):
    """Schema for updating a module view."""

    nombre: str | None = Field(None, min_length=1, max_length=255)
    tipo: str | None = Field(None, max_length=50)
    columns_config: dict[str, Any] | None = None
    filters: dict[str, Any] | None = None
    sort_by: dict[str, Any] | None = None
    group_by: str | None = None
    page_size: int | None = Field(None, ge=5, le=100)


class ModuleViewRead(ModuleViewBase):
    """Schema for reading a module view."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class ModuleViewList(BaseModel):
    """Paginated list of module views."""

    model_config = ConfigDict(from_attributes=True)

    data: list[ModuleViewRead]
    pagination: dict[str, Any] | None = None
