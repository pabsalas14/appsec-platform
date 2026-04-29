"""Evento forense SCR (append-only, sin soft delete)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CodeSecurityEvent(Base):
    """Línea de timeline de Git + metadatos del Detective."""

    __tablename__ = "code_security_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("code_security_reviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    commit_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    autor: Mapped[str] = mapped_column(String(512), nullable=False)
    archivo: Mapped[str] = mapped_column(String(1024), nullable=False)
    accion: Mapped[str] = mapped_column(String(32), nullable=False)
    mensaje_commit: Mapped[str | None] = mapped_column(Text(), nullable=True)
    nivel_riesgo: Mapped[str] = mapped_column(String(32), nullable=False)
    indicadores: Mapped[list[str]] = mapped_column(JSONB(), nullable=False, server_default=text("'[]'::jsonb"))
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )

    review: Mapped["CodeSecurityReview"] = relationship(
        "CodeSecurityReview", back_populates="events", lazy="noload"
    )
