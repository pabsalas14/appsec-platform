"""AceptacionRiesgo model — aceptación formal de riesgo de una vulnerabilidad.

Aplica:
  - SoftDeleteMixin (A2)
  - audit_action_prefix="aceptacion_riesgo" (A5)
  - SoD: aprobador_id != user_id cuando ReglaSoD "vulnerabilidad.aceptar_riesgo" está activa (A6)
  - justificacion_negocio obligatoria (A1)

Estados válidos: Pendiente | Aprobada | Rechazada | Vencida | Revocada
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.vulnerabilidad import Vulnerabilidad
    from app.models.user import User


class AceptacionRiesgo(SoftDeleteMixin, Base):
    __tablename__ = "aceptacion_riesgos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Analista que registra la aceptación de riesgo
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

    # ── Datos de la aceptación ──────────────────────────────────────────────
    # A1: justificacion_negocio obligatoria (validado en schema/service)
    justificacion_negocio: Mapped[str] = mapped_column(Text, nullable=False)

    # Propietario del riesgo (negocio responsable de la decisión)
    propietario_riesgo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Fecha obligatoria de revisión del riesgo aceptado
    fecha_revision_obligatoria: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    # estados: Pendiente | Aprobada | Rechazada | Vencida | Revocada
    estado: Mapped[str] = mapped_column(
        String(32), nullable=False, default="Pendiente", index=True
    )

    # ── Aprobación (SoD — A6) ───────────────────────────────────────────────
    # aprobador_id != user_id cuando regla activa
    aprobador_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    fecha_aprobacion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notas_aprobador: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Timestamps ──────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ────────────────────────────────────────────────────────
    vulnerabilidad: Mapped["Vulnerabilidad"] = relationship(
        "Vulnerabilidad", back_populates="aceptaciones_riesgo", lazy="noload"
    )
    solicitante: Mapped["User"] = relationship(
        "User", foreign_keys=[user_id], lazy="noload"
    )
    propietario_riesgo: Mapped["User"] = relationship(
        "User", foreign_keys=[propietario_riesgo_id], lazy="noload"
    )
    aprobador: Mapped["User | None"] = relationship(
        "User", foreign_keys=[aprobador_id], lazy="noload"
    )
