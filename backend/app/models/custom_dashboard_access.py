"""CustomDashboardAccess model — fine-grained permissions for custom dashboards (Fase 2)."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.custom_dashboard import CustomDashboard
    from app.models.role import Role
    from app.models.user import User


class CustomDashboardAccess(Base):
    """
    Controls who can view/edit custom dashboards.
    Can be set per-role OR per-user (owner can grant direct access).
    """

    __tablename__ = "custom_dashboard_access"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ─── Target Dashboard ───
    dashboard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("custom_dashboards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ─── Access Target (Role OR User) ───
    # Either role_id or user_id must be non-null (enforced at service layer)

    role_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    # If set: all users with this role get access

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    # If set: specific user gets access

    # ─── Permissions ───
    puede_ver: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Can view the dashboard

    puede_editar: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Can edit filters/widget layout (not the underlying queries)

    puede_compartir: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Can grant access to other users (owner-level permission)

    # ─── Relationships ───
    dashboard: Mapped[CustomDashboard] = relationship(foreign_keys=[dashboard_id])
    role: Mapped[Role | None] = relationship(foreign_keys=[role_id])
    user: Mapped[User | None] = relationship(foreign_keys=[user_id])
