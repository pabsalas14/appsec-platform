"""Navigation Item schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class NavigationItemBase(BaseModel):
    label: str = Field(..., min_length=1, max_length=255)
    path: str = Field(..., min_length=1, max_length=255)
    icon: str | None = Field(None, max_length=100)
    order: int = 0
    parent_id: UUID | None = None
    is_active: bool = True
    metadata: str | None = None


class NavigationItemCreate(NavigationItemBase):
    pass


class NavigationItemUpdate(BaseModel):
    label: str | None = Field(None, min_length=1, max_length=255)
    path: str | None = Field(None, min_length=1, max_length=255)
    icon: str | None = None
    order: int | None = None
    parent_id: UUID | None = None
    is_active: bool | None = None
    metadata: str | None = None


class NavigationItemRead(NavigationItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class NavigationItemReorder(BaseModel):
    order: int = Field(..., ge=0)


class NavigationTree(BaseModel):
    id: UUID
    label: str
    path: str
    icon: str | None = None
    order: int
    is_active: bool
    children: list["NavigationTree"] = []


NavigationTree.model_rebuild()
