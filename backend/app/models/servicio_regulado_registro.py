"""ServicioReguladoRegistro model — registro de cumplimiento regulatorio por servicio (Módulo 3.5).

Vincula un Servicio a una regulación en un ciclo (trimestre/año).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.servicio import Servicio
    from app.models.evidencia_regulacion import EvidenciaRegulacion
    from app.models.estado_cumplimiento import EstadoCumplimiento


class ServicioReguladoRegistro(SoftDeleteMixin, Base):
    __tablename__ = "servicio_regulado_registros"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    servicio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("servicios.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    nombre_regulacion: Mapped[str] = mapped_column(String(255), nullable=False)
    # ciclo: Q1 | Q2 | Q3 | Q4 | Anual
    ciclo: Mapped[str] = mapped_column(String(20), nullable=False)
    ano: Mapped[int] = mapped_column(Integer(), nullable=False, index=True)
    # estado: Pendiente | En Revision | Cumplido | No Cumplido | Parcial
    estado: Mapped[str] = mapped_column(String(50), nullable=False, default="Pendiente")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    servicio: Mapped["Servicio"] = relationship(back_populates="registros_regulacion")
    evidencias: Mapped[list["EvidenciaRegulacion"]] = relationship(
        "EvidenciaRegulacion", back_populates="registro", lazy="noload"
    )
    estados_cumplimiento: Mapped[list["EstadoCumplimiento"]] = relationship(
        "EstadoCumplimiento", back_populates="registro", lazy="noload"
    )
