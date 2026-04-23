"""HallazgoTercero model — hallazgo encontrado en revisión por tercero (Módulo 8).

Un hallazgo puede promover a Vulnerabilidad formal (vulnerabilidad_id, nullable).
Aplica SoftDeleteMixin (A2) y audit trail (A5).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, String, Text, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.revision_tercero import RevisionTercero
    from app.models.vulnerabilidad import Vulnerabilidad


class HallazgoTercero(SoftDeleteMixin, Base):
    __tablename__ = "hallazgo_terceros"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    revision_tercero_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("revision_terceros.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Si el hallazgo fue promovido a vulnerabilidad formal
    vulnerabilidad_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vulnerabilidads.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    # severidad: Critica | Alta | Media | Baja
    severidad: Mapped[str] = mapped_column(String(50), nullable=False)
    cvss_score: Mapped[float | None] = mapped_column(Float(), nullable=True)
    cwe_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # estado: Abierto | Falso Positivo | Aceptado | Remediado
    estado: Mapped[str] = mapped_column(String(50), nullable=False, default="Abierto")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ─── Relationships ─────────────────────────────────────────────────────────
    revision_tercero: Mapped["RevisionTercero"] = relationship(
        back_populates="hallazgos"
    )
    vulnerabilidad: Mapped["Vulnerabilidad | None"] = relationship(
        "Vulnerabilidad", back_populates="hallazgos_tercero", lazy="noload"
    )
