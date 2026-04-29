"""Hallazgo SCR — indicio de funcionalidad maliciosa (no entidad Vulnerabilidad)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin


class CodeSecurityFinding(SoftDeleteMixin, Base):
    """Hallazgo denormalizado por `user_id` para BaseService y tests de ownership."""

    __tablename__ = "code_security_findings"
    __table_args__ = (
        UniqueConstraint("review_id", "fingerprint", name="uq_scr_finding_review_fingerprint"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("code_security_reviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fingerprint: Mapped[str] = mapped_column(String(128), nullable=False, index=True)

    archivo: Mapped[str] = mapped_column(String(1024), nullable=False)
    linea_inicio: Mapped[int] = mapped_column(Integer(), nullable=False)
    linea_fin: Mapped[int] = mapped_column(Integer(), nullable=False)
    tipo_malicia: Mapped[str] = mapped_column(String(128), nullable=False)
    severidad: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    confianza: Mapped[float] = mapped_column(Float(), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text(), nullable=False)
    codigo_snippet: Mapped[str | None] = mapped_column(Text(), nullable=True)
    impacto: Mapped[str | None] = mapped_column(Text(), nullable=True)
    explotabilidad: Mapped[str | None] = mapped_column(Text(), nullable=True)
    remediacion_sugerida: Mapped[str | None] = mapped_column(Text(), nullable=True)
    estado: Mapped[str] = mapped_column(String(64), nullable=False, server_default=text("'DETECTED'"))
    asignado_a_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    review: Mapped["CodeSecurityReview"] = relationship(
        "CodeSecurityReview", back_populates="findings", lazy="noload"
    )
