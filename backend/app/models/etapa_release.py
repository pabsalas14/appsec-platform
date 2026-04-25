"""EtapaRelease model — etapa individual del flujo secuencial de un release (Módulo 8).

Flujo de estados: Pendiente → En Progreso → Aprobada | Rechazada
SoD configurable (A6): quien crea el release no puede aprobar sus etapas.
Justificación obligatoria al rechazar (A1).
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
    from app.models.service_release import ServiceRelease
    from app.models.user import User


class EtapaRelease(SoftDeleteMixin, Base):
    __tablename__ = "etapa_releases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    service_release_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("service_releases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Nombre de la etapa (ej. "Design Review", "Security Validation", ...)
    etapa: Mapped[str] = mapped_column(String(100), nullable=False)
    estado: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Pendiente"
    )
    # Quien aprobó / rechazó esta etapa (SoD: aprobador_id != user_id del release)
    aprobador_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Justificación obligatoria al rechazar (A1)
    justificacion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    notas: Mapped[str | None] = mapped_column(Text(), nullable=True)
    fecha_completada: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    # ─── Relationships ─────────────────────────────────────────────────────────
    service_release: Mapped[ServiceRelease] = relationship(back_populates="etapas")
    aprobador: Mapped[User | None] = relationship(
        "User", foreign_keys=[aprobador_id], lazy="noload"
    )
