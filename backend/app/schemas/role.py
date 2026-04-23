"""Role / Permission schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    description: Optional[str] = None


class RoleRead(BaseModel):
    """Wire shape exposed to the frontend — ``permissions`` is a list of codes."""

    id: UUID
    name: str
    description: Optional[str] = None
    permissions: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class RoleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=64)
    description: Optional[str] = None
    permissions: list[str] = Field(default_factory=list)


class RoleUpdate(BaseModel):
    description: Optional[str] = None
    permissions: Optional[list[str]] = None
