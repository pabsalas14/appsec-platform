"""Reporte ejecutivo SCR (Fiscal)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin


class CodeSecurityReport(SoftDeleteMixin, Base):
    """Síntesis por revisión — un registro por review completada."""

    __tablename__ = "code_security_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("code_security_reviews.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    resumen_ejecutivo: Mapped[str] = mapped_column(Text(), nullable=False)
    desglose_severidad: Mapped[dict] = mapped_column(JSONB(), nullable=False, server_default=text("'{}'::jsonb"))
    narrativa_evolucion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    pasos_remediacion: Mapped[list] = mapped_column(JSONB(), nullable=False, server_default=text("'[]'::jsonb"))
    puntuacion_riesgo_global: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("0"))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    review: Mapped["CodeSecurityReview"] = relationship(
        "CodeSecurityReview", back_populates="report", lazy="noload"
    )
