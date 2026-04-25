"""SavedWidget model — saved query configurations for Query Builder (Fase 1)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, JSON, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.user import User


class SavedWidget(SoftDeleteMixin, Base):
    """Persists query configurations for widgets created via Query Builder."""

    __tablename__ = "saved_widgets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # ─── Query Configuration (JSONB) ───
    # Estructura:
    # {
    #   "base_table": "vulnerabilidades",
    #   "joins": [{"table": "programas", "on_field": "programa_id", "type": "left"}],
    #   "select_fields": ["id", "titulo", "severidad", "estado"],
    #   "calculated_fields": [{"name": "sla_days", "formula": "days_until_sla()"}],
    #   "filters": [{"field": "severidad", "operator": "=", "value": "CRITICA"}],
    #   "group_by": ["severidad"],
    #   "aggregations": [{"field": "count(*)", "alias": "total"}],
    #   "order_by": [{"field": "created_at", "direction": "DESC"}],
    #   "limit": 100
    # }
    query_config: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    # ─── Chart/Display Configuration ───
    chart_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="data_table",
        server_default=text("'data_table'"),
    )
    # Valores posibles: kpi_card, bar_chart, line_chart, donut_gauge, data_table, heatmap, alert_list

    # ─── Preview & Metadata ───
    preview_data: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    # Último resultado ejecutado: {labels: [], values: [], rows: [], meta: {}}

    row_count: Mapped[int | None] = mapped_column(nullable=True)
    # Cantidad de filas en el último resultado

    last_executed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Cuándo se ejecutó por última vez

    # ─── Ownership & Permissions ───
    user_id: Mapped[uuid.UUID] = mapped_column(
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
    user: Mapped[User] = relationship(foreign_keys=[user_id])
