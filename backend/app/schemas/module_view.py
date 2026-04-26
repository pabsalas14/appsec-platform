"""Module View schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ModuleViewBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    entity_type: str = Field(..., min_length=1, max_length=100)
    display_type: str = Field(default="table", max_length=50)
    config: str | None = None


class ModuleViewCreate(ModuleViewBase):
    pass


class ModuleViewUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    display_type: str | None = Field(None, max_length=50)
    config: str | None = None


class ModuleViewRead(ModuleViewBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class ModuleViewDuplicate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
