"""Navigation Item schemas — dynamic sidebar navigation items."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class NavigationItemBase(BaseModel):
    """Shared fields for navigation items."""

    label: str = Field(..., min_length=1, max_length=255, description="Display label")
    href: str = Field(..., min_length=1, max_length=500, description="Route URL")
    icon: str | None = Field(None, max_length=100, description="Icon name (lucide)")
    orden: int = Field(default=0, ge=0, description="Sort order (lower = earlier)")
    parent_id: UUID | None = Field(None, description="Parent item ID for nested menu")
    visible: bool = Field(default=True, description="Visibility flag")
    required_role: str | None = Field(None, max_length=100, description="Required role (null=all)")


class NavigationItemCreate(NavigationItemBase):
    """Payload for POST /admin/navigation."""

    pass


class NavigationItemUpdate(BaseModel):
    """Payload for PATCH /admin/navigation/{id}."""

    label: str | None = Field(None, min_length=1, max_length=255)
    href: str | None = Field(None, min_length=1, max_length=500)
    icon: str | None = None
    orden: int | None = Field(None, ge=0)
    parent_id: UUID | None = None
    visible: bool | None = None
    required_role: str | None = None


class NavigationItemRead(NavigationItemBase):
    """Response model for single navigation item."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class NavigationItemList(BaseModel):
    """Response model for GET /admin/navigation (paginated list)."""

    model_config = ConfigDict(from_attributes=True)

    items: list[NavigationItemRead]
    total: int
    skip: int
    limit: int


class NavigationTreeNode(BaseModel):
    """Tree node for hierarchical navigation response."""

    id: UUID
    label: str
    href: str
    icon: str | None = None
    orden: int
    visible: bool
    required_role: str | None = None
    children: list["NavigationTreeNode"] = []
    model_config = ConfigDict(from_attributes=True)


NavigationTreeNode.model_rebuild()


__all__ = [
    "NavigationItemCreate",
    "NavigationItemRead",
    "NavigationItemUpdate",
    "NavigationItemList",
    "NavigationTreeNode",
]
