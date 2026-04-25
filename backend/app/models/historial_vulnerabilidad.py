"""HistorialVulnerabilidad model — inmutable audit trail de cambios de estado.

Registra cada transición de estado, cambio de responsable o acción relevante
sobre una Vulnerabilidad. Deliberadamente sin SoftDelete — los historiales
son inmutables una vez creados (tamper-evident por diseño).
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.vulnerabilidad import Vulnerabilidad


class HistorialVulnerabilidad(Base):
    __tablename__ = "historial_vulnerabilidads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Analista que realizó el cambio
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Referencia a la vulnerabilidad ──────────────────────────────────────
    vulnerabilidad_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vulnerabilidads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Datos del cambio ────────────────────────────────────────────────────
    estado_anterior: Mapped[str | None] = mapped_column(String(64), nullable=True)
    estado_nuevo: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Nuevo responsable asignado en este cambio (si aplica)
    responsable_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Justificación obligatoria en acciones críticas (regla A1)
    justificacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    comentario: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Timestamp ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    # ── Relationships ────────────────────────────────────────────────────────
    vulnerabilidad: Mapped[Vulnerabilidad] = relationship("Vulnerabilidad", back_populates="historial", lazy="noload")
    actor: Mapped[User] = relationship("User", foreign_keys=[user_id], lazy="noload")
    responsable: Mapped[User | None] = relationship("User", foreign_keys=[responsable_id], lazy="noload")
