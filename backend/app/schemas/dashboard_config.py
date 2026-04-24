"""DashboardConfig schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DashboardConfigBase(BaseModel):
    dashboard_id: str
    widget_id: str
    role_id: UUID
    visible: bool
    editable_by_role: bool


class DashboardConfigCreate(DashboardConfigBase):
    """Fields required to create a dashboard config."""

    pass


class DashboardConfigUpdate(BaseModel):
    """All fields optional for partial updates."""

    dashboard_id: Optional[str] = None
    widget_id: Optional[str] = None
    role_id: Optional[UUID] = None
    visible: Optional[bool] = None
    editable_by_role: Optional[bool] = None


class DashboardConfigRead(DashboardConfigBase):
    """Full dashboard config representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
