"""Project schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProjectBase(BaseModel):
    name: str
    description: str | None = None
    status: str = "active"
    color: str | None = None


class ProjectCreate(ProjectBase):
    """Fields required to create a project. user_id is set from auth context."""


class ProjectUpdate(BaseModel):
    """All fields optional for partial updates."""

    name: str | None = None
    description: str | None = None
    status: str | None = None
    color: str | None = None


class ProjectRead(ProjectBase):
    """Full project representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
