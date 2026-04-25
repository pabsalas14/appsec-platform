"""DashboardConfig schemas — Pydantic v2 for widget visibility config (Fase 2)."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DashboardConfigBase(BaseModel):
    """Common fields for DashboardConfig."""

    dashboard_id: UUID
    widget_id: str = Field(..., min_length=1, max_length=255)
    role_id: UUID
    visible: bool = Field(default=True)
    editable_by_role: bool = Field(default=False)


class DashboardConfigCreate(DashboardConfigBase):
    """Fields required to create config."""

    pass


class DashboardConfigUpdate(BaseModel):
    """All fields optional for partial updates."""

    visible: bool | None = None
    editable_by_role: bool | None = None


class DashboardConfigRead(DashboardConfigBase):
    """Full representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
