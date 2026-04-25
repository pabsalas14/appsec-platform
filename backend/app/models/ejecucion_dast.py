"""EjecucionDast model — ejecución puntual de análisis DAST (Módulo 3.2)."""

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
    from app.models.hallazgo_dast import HallazgoDast
    from app.models.programa_dast import ProgramaDast


class EjecucionDast(SoftDeleteMixin, Base):
    __tablename__ = "ejecucion_dasts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    programa_dast_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("programa_dasts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_fin: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # ambiente: Desarrollo | Staging | Produccion
    ambiente: Mapped[str] = mapped_column(String(50), nullable=False)
    herramienta: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # resultado: Pendiente | En Progreso | Exitoso | Fallido | Cancelado
    resultado: Mapped[str] = mapped_column(String(50), nullable=False, default="Pendiente")
    notas: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    programa_dast: Mapped[ProgramaDast] = relationship(back_populates="ejecuciones")
    hallazgos: Mapped[list[HallazgoDast]] = relationship(
        "HallazgoDast", back_populates="ejecucion_dast", lazy="noload"
    )
