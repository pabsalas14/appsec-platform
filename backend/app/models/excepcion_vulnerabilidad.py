"""ExcepcionVulnerabilidad model — excepciones temporales al remedio de una vulnerabilidad.

Aplica:
  - SoftDeleteMixin (A2)
  - audit_action_prefix="excepcion_vulnerabilidad" (A5)
  - SoD: aprobador_id != user_id cuando ReglaSoD "vulnerabilidad.aprobar_excepcion" está activa (A6)
  - justificacion obligatoria (A1)

Estados válidos: Pendiente | Aprobada | Rechazada | Vencida | Revocada
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.vulnerabilidad import Vulnerabilidad


class ExcepcionVulnerabilidad(SoftDeleteMixin, Base):
    __tablename__ = "excepcion_vulnerabilidads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Analista que solicita la excepción
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

    # ── Datos de la excepción ───────────────────────────────────────────────
    # A1: justificacion obligatoria (validado en schema/service)
    justificacion: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_limite: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # estados: Pendiente | Aprobada | Rechazada | Vencida | Revocada
    estado: Mapped[str] = mapped_column(String(32), nullable=False, default="Pendiente", index=True)

    # ── Aprobación (SoD — A6) ───────────────────────────────────────────────
    # aprobador_id != user_id cuando regla activa
    aprobador_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    fecha_aprobacion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notas_aprobador: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Timestamps ──────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    # ── Relationships ────────────────────────────────────────────────────────
    vulnerabilidad: Mapped[Vulnerabilidad] = relationship("Vulnerabilidad", back_populates="excepciones", lazy="noload")
    solicitante: Mapped[User] = relationship("User", foreign_keys=[user_id], lazy="noload")
    aprobador: Mapped[User | None] = relationship("User", foreign_keys=[aprobador_id], lazy="noload")
