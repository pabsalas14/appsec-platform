"""EvidenciaAuditoria model — evidence with SHA-256 hash (Módulo 6, regla A3)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.auditoria import Auditoria


class EvidenciaAuditoria(SoftDeleteMixin, Base):
    __tablename__ = "evidencia_auditorias"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    auditoria_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("auditorias.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre_archivo: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo_evidencia: Mapped[str] = mapped_column(String(100), nullable=False)
    url_archivo: Mapped[str] = mapped_column(String(512), nullable=False)
    hash_sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    auditoria: Mapped["Auditoria"] = relationship(back_populates="evidencias")
