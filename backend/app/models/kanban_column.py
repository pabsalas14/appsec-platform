"""KanbanColumn model — configuración de columnas del tablero kanban de releases.

Aplica:
  - SoftDeleteMixin (A2)
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, String, Text, Integer, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import SoftDeleteMixin


class KanbanColumn(SoftDeleteMixin, Base):
    """Kanban column configuration for release management."""

    __tablename__ = "kanban_columns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=False, default="#3b82f6")
    icono: Mapped[str | None] = mapped_column(String(50), nullable=True)
    orden: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    # Link to the actual release state (e.g., "Borrador", "En Produccion")
    estado_correspondiente: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )
