"""Task schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TaskBase(BaseModel):
    title: str
    description: str | None = None
    completed: bool = False
    status: str = "todo"
    project_id: UUID | None = None


class TaskCreate(TaskBase):
    """Fields required to create a task. user_id is set from the auth context."""


class TaskUpdate(BaseModel):
    """All fields optional for partial updates."""

    title: str | None = None
    description: str | None = None
    completed: bool | None = None
    status: str | None = None
    project_id: UUID | None = None


class TaskRead(TaskBase):
    """Full task representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
