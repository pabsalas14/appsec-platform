"""EjecucionMAST model — MAST execution for mobile app (Módulo 4)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.aplicacion_movil import AplicacionMovil
    from app.models.hallazgo_mast import HallazgoMAST


class EjecucionMAST(SoftDeleteMixin, Base):
    __tablename__ = "ejecucion_masts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    aplicacion_movil_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("aplicacion_movils.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ambiente: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_fin: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resultado: Mapped[str] = mapped_column(String(50), nullable=False)
    url_reporte: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    aplicacion_movil: Mapped[AplicacionMovil] = relationship(back_populates="ejecuciones_mast")
    hallazgos: Mapped[list[HallazgoMAST]] = relationship(
        "HallazgoMAST", back_populates="ejecucion", lazy="noload"
    )
