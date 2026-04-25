"""RevisionTercero model — revisión de seguridad por proveedor externo (Módulo 8).

Polymorphic: vinculado a servicio_id O activo_web_id (al menos uno).
El informe tiene hash SHA-256 almacenado (A3).
"""

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
    from app.models.activo_web import ActivoWeb
    from app.models.hallazgo_tercero import HallazgoTercero
    from app.models.servicio import Servicio


class RevisionTercero(SoftDeleteMixin, Base):
    __tablename__ = "revision_terceros"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre_empresa: Mapped[str] = mapped_column(String(255), nullable=False)
    # tipo: Pentest | Auditoria de Codigo | Evaluacion de Arquitectura | ...
    tipo: Mapped[str] = mapped_column(String(100), nullable=False)
    # Polymorphic: al menos uno debe estar presente (validado en schema/service)
    servicio_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("servicios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    activo_web_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("activo_webs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    fecha_inicio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    fecha_fin: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # estado: Planificada | En Curso | Completada | Cancelada
    estado: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Planificada"
    )
    # Informe con integridad SHA-256 (A3)
    informe_filename: Mapped[str | None] = mapped_column(String(500), nullable=True)
    informe_sha256: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    # ─── Relationships ─────────────────────────────────────────────────────────
    servicio: Mapped[Servicio | None] = relationship(back_populates="revision_terceros")
    activo_web: Mapped[ActivoWeb | None] = relationship(
        back_populates="revision_terceros"
    )
    hallazgos: Mapped[list[HallazgoTercero]] = relationship(
        "HallazgoTercero", back_populates="revision_tercero", lazy="noload"
    )
