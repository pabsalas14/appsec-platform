"""SavedWidget schemas — Pydantic v2 for Query Builder (Fase 1)."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class QueryConfig(BaseModel):
    """Query configuration structure inside SavedWidget."""

    base_table: str = Field(..., description="Main table name (e.g., 'vulnerabilidades')")
    joins: list[dict[str, Any]] | None = Field(None, description="List of joins: {table, on_field, type}")
    select_fields: list[str] | None = Field(None, description="Fields to select")
    calculated_fields: list[dict[str, Any]] | None = Field(
        None,
        description="Calculated fields: [{name, formula}, ...]",
    )
    filters: list[dict[str, Any]] | None = Field(
        None,
        description="Filter conditions: [{field, operator, value}, ...]",
    )
    group_by: list[str] | None = Field(None, description="GROUP BY fields")
    aggregations: list[dict[str, Any]] | None = Field(
        None,
        description="Aggregations: [{field, alias}, ...]",
    )
    order_by: list[dict[str, Any]] | None = Field(
        None,
        description="ORDER BY: [{field, direction}, ...]",
    )
    limit: int | None = Field(None, ge=1, le=10000, description="Result limit (1-10000)")


class SavedWidgetBase(BaseModel):
    """Common fields for SavedWidget."""

    nombre: str = Field(..., min_length=1, max_length=255)
    descripcion: str | None = Field(None, max_length=1000)
    query_config: dict[str, Any] = Field(..., description="Query configuration (JSONB)")
    chart_type: str = Field(default="data_table", description="Chart type: kpi_card, bar_chart, etc.")


class SavedWidgetCreate(SavedWidgetBase):
    """Fields required to create a SavedWidget."""

    pass


class SavedWidgetUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: str | None = Field(None, min_length=1, max_length=255)
    descripcion: str | None = Field(None, max_length=1000)
    query_config: dict[str, Any] | None = None
    chart_type: str | None = None


class SavedWidgetRead(SavedWidgetBase):
    """Full SavedWidget representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    preview_data: dict[str, Any] | None = None
    row_count: int | None = None
    last_executed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
