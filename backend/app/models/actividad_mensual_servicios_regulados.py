"""ActividadMensualServiciosRegulados — actividad mensual del programa Servicios Regulados (BRD §5.5)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.servicio_regulado_registro import ServicioReguladoRegistro


class ActividadMensualServiciosRegulados(SoftDeleteMixin, Base):
    __tablename__ = "actividad_mensual_servicios_regulados"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    servicio_regulado_registro_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("servicio_regulado_registros.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    mes: Mapped[int] = mapped_column(Integer(), nullable=False)
    ano: Mapped[int] = mapped_column(Integer(), nullable=False, index=True)
    total_hallazgos: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    criticos: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    altos: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    medios: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    bajos: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    sub_estado: Mapped[str | None] = mapped_column(String(100), nullable=True)
    score: Mapped[float | None] = mapped_column(Float(), nullable=True)
    notas: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    servicio_regulado_registro: Mapped[ServicioReguladoRegistro] = relationship(back_populates="actividades_mensuales")
