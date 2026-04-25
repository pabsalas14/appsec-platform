"""EvidenciaRemediacion model — archivos de evidencia de remediación de vulnerabilidades.

Aplica:
  - SoftDeleteMixin (A2)
  - audit_action_prefix="evidencia_remediacion" (A5)
  - sha256 calculado al subir el archivo (A3) — guardado aquí, calculado en service

El hash SHA-256 del archivo se calcula en el servicio al momento del upload
y se almacena para verificación de integridad (regla A3).
"""

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
    from app.models.user import User
    from app.models.vulnerabilidad import Vulnerabilidad


class EvidenciaRemediacion(SoftDeleteMixin, Base):
    __tablename__ = "evidencia_remediacions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Analista que sube la evidencia
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Referencia a la vulnerabilidad ──────────────────────────────────────
    vulnerabilidad_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vulnerabilidads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Datos del archivo (A3) ──────────────────────────────────────────────
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # Hash SHA-256 del archivo para integridad (regla A3)
    sha256: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    # Tamaño en bytes
    file_size: Mapped[int | None] = mapped_column(nullable=True)

    # ── Timestamps ──────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    # ── Relationships ────────────────────────────────────────────────────────
    vulnerabilidad: Mapped[Vulnerabilidad] = relationship(
        "Vulnerabilidad", back_populates="evidencias_remediacion", lazy="noload"
    )
    uploader: Mapped[User] = relationship("User", foreign_keys=[user_id], lazy="noload")
