"""ProgramaThreatModeling model — programa de modelado de amenazas STRIDE/DREAD (Módulo 3.3).

Puede vincularse a un ActivoWeb o Servicio (polymorphic, al menos uno requerido).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String, Text, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.activo_web import ActivoWeb
    from app.models.servicio import Servicio
    from app.models.sesion_threat_modeling import SesionThreatModeling


class ProgramaThreatModeling(SoftDeleteMixin, Base):
    __tablename__ = "programa_threat_modelings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    ano: Mapped[int] = mapped_column(Integer(), nullable=False, index=True)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    # Polymorphic: al menos uno debe estar presente (validado en schema/service)
    activo_web_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("activo_webs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    servicio_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("servicios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # estado: Activo | Completado | Cancelado
    estado: Mapped[str] = mapped_column(String(50), nullable=False, default="Activo")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    activo_web: Mapped["ActivoWeb | None"] = relationship(
        back_populates="programas_threat_modeling"
    )
    servicio: Mapped["Servicio | None"] = relationship(
        back_populates="programas_threat_modeling"
    )
    sesiones: Mapped[list["SesionThreatModeling"]] = relationship(
        "SesionThreatModeling", back_populates="programa_tm", lazy="noload"
    )
