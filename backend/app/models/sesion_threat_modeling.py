"""SesionThreatModeling model — sesión de modelado de amenazas (Módulo 3.3).

Cada sesión puede tener múltiples Amenazas identificadas con scoring DREAD.
Si ia_utilizada=True, la sesión fue asistida por el módulo IA (13.1).
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.activo_web import ActivoWeb
    from app.models.amenaza import Amenaza
    from app.models.programa_threat_modeling import ProgramaThreatModeling


class SesionThreatModeling(SoftDeleteMixin, Base):
    __tablename__ = "sesion_threat_modelings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    programa_tm_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("programa_threat_modelings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    participantes: Mapped[str | None] = mapped_column(Text(), nullable=True)
    contexto: Mapped[str | None] = mapped_column(Text(), nullable=True)
    # estado: Planificada | En Curso | Completada | Cancelada
    estado: Mapped[str] = mapped_column(String(50), nullable=False, default="Planificada")
    # True si fue asistida por IA (entrada al Módulo 13.1)
    ia_utilizada: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    backlog_tareas: Mapped[str | None] = mapped_column(Text(), nullable=True)
    plan_trabajo: Mapped[str | None] = mapped_column(Text(), nullable=True)
    activo_web_secundario_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("activo_webs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    programa_tm: Mapped[ProgramaThreatModeling] = relationship(back_populates="sesiones")
    activo_web_secundario: Mapped[ActivoWeb | None] = relationship("ActivoWeb", lazy="noload")
    amenazas: Mapped[list[Amenaza]] = relationship("Amenaza", back_populates="sesion", lazy="noload")
