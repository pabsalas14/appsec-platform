"""HallazgoPipeline model — hallazgo encontrado en pipeline CI/CD (Módulo 8).

Un hallazgo puede promover a Vulnerabilidad (vulnerabilidad_id, nullable).
Aplica SoftDeleteMixin (A2) y audit trail (A5).
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
    from app.models.pipeline_release import PipelineRelease
    from app.models.vulnerabilidad import Vulnerabilidad


class HallazgoPipeline(SoftDeleteMixin, Base):
    __tablename__ = "hallazgo_pipelines"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pipeline_release_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pipeline_releases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Si el hallazgo se promovió a vulnerabilidad formal
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
    archivo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    linea: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    regla: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # estado: Abierto | Falso Positivo | Aceptado | Remediado
    estado: Mapped[str] = mapped_column(String(50), nullable=False, default="Abierto")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    # ─── Relationships ─────────────────────────────────────────────────────────
    pipeline_release: Mapped[PipelineRelease] = relationship(back_populates="hallazgos")
    vulnerabilidad: Mapped[Vulnerabilidad | None] = relationship(
        "Vulnerabilidad", back_populates="hallazgos_pipeline", lazy="noload"
    )
