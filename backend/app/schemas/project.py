"""Project schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "active"
    color: Optional[str] = None


class ProjectCreate(ProjectBase):
    """Fields required to create a project. user_id is set from auth context."""


class ProjectUpdate(BaseModel):
    """All fields optional for partial updates."""

    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    color: Optional[str] = None


class ProjectRead(ProjectBase):
    """Full project representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
