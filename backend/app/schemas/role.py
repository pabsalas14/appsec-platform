"""Role / Permission schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    description: str | None = None


class RoleRead(BaseModel):
    """Wire shape exposed to the frontend — ``permissions`` is a list of codes."""

    id: UUID
    name: str
    description: str | None = None
    permissions: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class RoleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=64)
    description: str | None = None
    permissions: list[str] = Field(default_factory=list)


class RoleUpdate(BaseModel):
    description: str | None = None
    permissions: list[str] | None = None
