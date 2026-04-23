"""Task schemas — Pydantic v2."""

from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False
    status: str = "todo"
    project_id: Optional[UUID] = None


class TaskCreate(TaskBase):
    """Fields required to create a task. user_id is set from the auth context."""


class TaskUpdate(BaseModel):
    """All fields optional for partial updates."""

    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    status: Optional[str] = None
    project_id: Optional[UUID] = None


class TaskRead(TaskBase):
    """Full task representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
