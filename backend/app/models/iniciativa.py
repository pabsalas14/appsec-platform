"""Iniciativa model — iniciativa de seguridad (Módulo 5)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.actualizacion_iniciativa import ActualizacionIniciativa
    from app.models.hito_iniciativa import HitoIniciativa


class Iniciativa(SoftDeleteMixin, Base):
    __tablename__ = "iniciativas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    celula_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("celulas.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    tipo: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    estado: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    fecha_inicio: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_fin_estimada: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )
    custom_fields: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    hitos: Mapped[list[HitoIniciativa]] = relationship("HitoIniciativa", back_populates="iniciativa", lazy="noload")
    actualizaciones: Mapped[list[ActualizacionIniciativa]] = relationship(
        "ActualizacionIniciativa", back_populates="iniciativa", lazy="noload"
    )
