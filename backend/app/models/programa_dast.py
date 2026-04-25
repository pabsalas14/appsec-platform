"""ProgramaDAST model — programa anual de análisis de seguridad web dinámica (Módulo 3.2)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.activo_web import ActivoWeb
    from app.models.ejecucion_dast import EjecucionDast


class ProgramaDast(SoftDeleteMixin, Base):
    __tablename__ = "programa_dasts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    activo_web_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("activo_webs.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    ano: Mapped[int] = mapped_column(Integer(), nullable=False, index=True)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    # estado: Activo | Completado | Cancelado
    estado: Mapped[str] = mapped_column(String(50), nullable=False, default="Activo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    activo_web: Mapped[ActivoWeb] = relationship(back_populates="programas_dast")
    ejecuciones: Mapped[list[EjecucionDast]] = relationship(
        "EjecucionDast", back_populates="programa_dast", lazy="noload"
    )
