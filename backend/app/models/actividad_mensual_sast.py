"""ActividadMensualSast model — actividad mensual de SAST por repositorio (Módulo 3.1).

Registra los hallazgos por severidad de un mes. El score se calcula automáticamente
desde los conteos y los pesos configurados en admin.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.hallazgo_sast import HallazgoSast
    from app.models.programa_sast import ProgramaSast


class ActividadMensualSast(SoftDeleteMixin, Base):
    __tablename__ = "actividad_mensual_sasts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    programa_sast_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("programa_sasts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    mes: Mapped[int] = mapped_column(Integer(), nullable=False)   # 1-12
    ano: Mapped[int] = mapped_column(Integer(), nullable=False, index=True)
    # Conteos por severidad
    total_hallazgos: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    criticos: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    altos: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    medios: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    bajos: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    # Score calculado desde pesos de configuración
    score: Mapped[float | None] = mapped_column(Float(), nullable=True)
    notas: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    # ─── Relationships ─────────────────────────────────────────────────────────
    programa_sast: Mapped[ProgramaSast] = relationship(back_populates="actividades")
    hallazgos: Mapped[list[HallazgoSast]] = relationship(
        "HallazgoSast", back_populates="actividad_sast", lazy="noload"
    )
