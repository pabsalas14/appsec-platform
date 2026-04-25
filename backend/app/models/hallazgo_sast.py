"""HallazgoSast model — hallazgo individual de análisis SAST/SCA (Módulo 3.1).

Puede promover a Vulnerabilidad formal (vulnerabilidad_id nullable).
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.actividad_mensual_sast import ActividadMensualSast
    from app.models.vulnerabilidad import Vulnerabilidad


class HallazgoSast(SoftDeleteMixin, Base):
    __tablename__ = "hallazgo_sasts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actividad_sast_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("actividad_mensual_sasts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vulnerabilidad_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vulnerabilidads.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    # severidad: Critica | Alta | Media | Baja
    severidad: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    herramienta: Mapped[str | None] = mapped_column(String(255), nullable=True)
    regla: Mapped[str | None] = mapped_column(String(255), nullable=True)
    archivo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    linea: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    # estado: Abierto | Falso Positivo | Aceptado | Remediado
    estado: Mapped[str] = mapped_column(String(50), nullable=False, default="Abierto")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    # ─── Relationships ─────────────────────────────────────────────────────────
    actividad_sast: Mapped[ActividadMensualSast] = relationship(back_populates="hallazgos")
    vulnerabilidad: Mapped[Vulnerabilidad | None] = relationship(
        "Vulnerabilidad", back_populates="hallazgos_sast", lazy="noload"
    )
