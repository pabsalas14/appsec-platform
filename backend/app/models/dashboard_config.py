"""DashboardConfig model — widget-level visibility configuration by role (Fase 2)."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.role import Role


class DashboardConfig(Base):
    """
    Configures which widgets/panels are visible to which roles.
    Granular control: can hide/show individual widgets per role.
    """

    __tablename__ = "dashboard_config"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ─── Target Dashboard ───
    # Logical id: built-in slug (e.g. "home") or custom dashboard UUID as string.
    dashboard_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # ─── Widget/Panel Identifier ───
    widget_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    # Corresponds to widget.id in the layout_json (e.g., "w1", "w2", etc.)

    # ─── Role-Based Visibility ───
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ─── Permissions ───
    visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # True = widget is shown to users with this role
    # False = widget is hidden from users with this role

    editable_by_role: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Can users with this role edit the widget's filters and config?

    # ─── Relationships ───
    role: Mapped[Role] = relationship(foreign_keys=[role_id])
