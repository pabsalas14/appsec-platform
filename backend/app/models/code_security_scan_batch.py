"""Lote de escaneo SCR (p. ej. organización GitHub con N repositorios)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin


class CodeSecurityScanBatch(SoftDeleteMixin, Base):
    """Agrupa revisiones disparadas juntas (modo org / campaña)."""

    __tablename__ = "code_security_scan_batches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    github_org_slug: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    estado: Mapped[str] = mapped_column(String(64), nullable=False, server_default=text("'PENDING'"))
    notas: Mapped[str | None] = mapped_column(Text(), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    reviews: Mapped[list["CodeSecurityReview"]] = relationship(
        "CodeSecurityReview", back_populates="scan_batch", lazy="noload"
    )
