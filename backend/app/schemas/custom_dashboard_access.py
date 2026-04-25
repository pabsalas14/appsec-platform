"""CustomDashboardAccess schemas — Pydantic v2 for dashboard permissions (Fase 2)."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CustomDashboardAccessBase(BaseModel):
    """Common fields for CustomDashboardAccess."""

    dashboard_id: UUID
    role_id: UUID | None = Field(None)
    user_id: UUID | None = Field(None)
    puede_ver: bool = Field(default=True)
    puede_editar: bool = Field(default=False)
    puede_compartir: bool = Field(default=False)


class CustomDashboardAccessCreate(CustomDashboardAccessBase):
    """Fields required to create access."""

    pass


class CustomDashboardAccessUpdate(BaseModel):
    """All fields optional for partial updates."""

    puede_ver: bool | None = None
    puede_editar: bool | None = None
    puede_compartir: bool | None = None


class CustomDashboardAccessRead(CustomDashboardAccessBase):
    """Full representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
