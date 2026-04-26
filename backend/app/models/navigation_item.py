"""NavigationItem model — dynamic sidebar navigation (Fase 7)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.user import User


class NavigationItem(SoftDeleteMixin, Base):
    """
    Dynamic sidebar navigation items.
    Allows admins to configure sidebar labels, order, visibility per role.
    """

    __tablename__ = "navigation_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Display label (e.g., "Vulnerabilidades", "Dashboards")
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Icon name (e.g., "shield-alert", "bar-chart-2")
    icon: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Route href (e.g., "/vulnerabilidades", "/admin/settings")
    href: Mapped[str] = mapped_column(String(500), nullable=False)
    
    # Sort order (lower = earlier in menu)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    
    # Visibility flag
    visible: Mapped[bool] = mapped_column(default=True)
    
    # Required role to see this item (optional, null = all roles)
    required_role: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Parent item ID (for nested menus)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("navigation_items.id", ondelete="CASCADE"),
        nullable=True,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    def __repr__(self) -> str:
        return f"<NavigationItem {self.label} (href={self.href}, orden={self.orden})>"
