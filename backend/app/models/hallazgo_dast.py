"""HallazgoDast model — hallazgo de análisis DAST (Módulo 3.2)."""

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
    from app.models.ejecucion_dast import EjecucionDast
    from app.models.vulnerabilidad import Vulnerabilidad


class HallazgoDast(SoftDeleteMixin, Base):
    __tablename__ = "hallazgo_dasts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ejecucion_dast_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ejecucion_dasts.id", ondelete="CASCADE"),
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
    severidad: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    parametro: Mapped[str | None] = mapped_column(String(255), nullable=True)
    estado: Mapped[str] = mapped_column(String(50), nullable=False, default="Abierto")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    ejecucion_dast: Mapped["EjecucionDast"] = relationship(back_populates="hallazgos")
    vulnerabilidad: Mapped["Vulnerabilidad | None"] = relationship(
        "Vulnerabilidad", back_populates="hallazgos_dast", lazy="noload"
    )
