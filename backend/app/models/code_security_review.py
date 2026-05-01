"""Revisión SCR — hallazgos de código malicioso (no vulnerabilidades de catálogo SAST)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin


class CodeSecurityReview(SoftDeleteMixin, Base):
    """Cabecera de análisis por usuario."""

    __tablename__ = "code_security_reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    estado: Mapped[str] = mapped_column(String(64), nullable=False, index=True, server_default=text("'PENDING'"))
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    progreso: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("0"))
    rama_analizar: Mapped[str] = mapped_column(String(255), nullable=False)
    url_repositorio: Mapped[str | None] = mapped_column(Text(), nullable=True)
    scan_mode: Mapped[str] = mapped_column(String(64), nullable=False)
    repositorio_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("repositorios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    github_org_slug: Mapped[str | None] = mapped_column(String(255), nullable=True)

    last_analyzed_commit: Mapped[str | None] = mapped_column(String(64), nullable=True)
    last_analyzed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    analysis_version: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("1"))

    scan_batch_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("code_security_scan_batches.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Configuration (LLM provider, temperature, etc)
    scr_config: Mapped[dict | None] = mapped_column(JSONB(), nullable=True, server_default=text("'{}'::jsonb"))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    scan_batch: Mapped["CodeSecurityScanBatch | None"] = relationship(
        "CodeSecurityScanBatch", back_populates="reviews", lazy="noload"
    )
    findings: Mapped[list["CodeSecurityFinding"]] = relationship(
        "CodeSecurityFinding", back_populates="review", lazy="noload"
    )
    events: Mapped[list["CodeSecurityEvent"]] = relationship(
        "CodeSecurityEvent", back_populates="review", lazy="noload"
    )
    report: Mapped["CodeSecurityReport | None"] = relationship(
        "CodeSecurityReport", back_populates="review", uselist=False, lazy="noload"
    )
