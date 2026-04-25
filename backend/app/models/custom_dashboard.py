"""CustomDashboard model — user-created dashboards with JSON layouts (Fase 2)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Integer, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.user import User


class CustomDashboard(SoftDeleteMixin, Base):
    """
    Custom dashboards created by users via Dashboard Builder.
    Stores layout configuration as JSONB for drag-drop grid.
    """

    __tablename__ = "custom_dashboards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # ─── Layout Configuration (JSONB) ───
    # Estructura (react-grid-layout compatible):
    # {
    #   "version": 1,
    #   "grid": {
    #     "cols": 12,
    #     "rowHeight": 80,
    #     "compactType": "vertical"
    #   },
    #   "widgets": [
    #     {
    #       "id": "w1",
    #       "type": "kpi_card" | "bar_chart" | "line_chart" | etc.,
    #       "layout": {"x": 0, "y": 0, "w": 3, "h": 2, "minW": 2, "minH": 2},
    #       "config": {
    #         "title": "Vulnerabilities",
    #         "dataSource": "vulnerabilidades",
    #         "metric": "count",
    #         "filters": {...},
    #         "display": {...}
    #       }
    #     },
    #     ...
    #   ]
    # }
    layout_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    # ─── Dashboard Metadata ───
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    # True = uno de los 9 dashboards fijos (Ejecutivo, Equipo, etc.)
    # False = dashboard custom creado por usuario

    is_template: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    # True = plantilla clonable (admin puede crear templates)

    orden: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    # Orden en el sidebar

    icono: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Nombre de ícono (ej: "chart-line", "shield-alert")

    activo: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    # Soft toggle para desactivar sin borrar

    # ─── Ownership & Permissions ───
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ─── Timestamps (SoftDeleteMixin provides deleted_at, deleted_by) ───
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # ─── Relationships ───
    created_by_user: Mapped[User] = relationship(foreign_keys=[created_by])
