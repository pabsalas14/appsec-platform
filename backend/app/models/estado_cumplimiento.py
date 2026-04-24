"""EstadoCumplimiento model — estado de cumplimiento de un control regulatorio (Módulo 3.5)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, String, Text, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.servicio_regulado_registro import ServicioReguladoRegistro


class EstadoCumplimiento(SoftDeleteMixin, Base):
    __tablename__ = "estado_cumplimientos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    registro_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("servicio_regulado_registros.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    control_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("regulacion_controls.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # estado: Cumple | No Cumple | Parcial | No Aplica
    estado: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    porcentaje: Mapped[float | None] = mapped_column(Float(), nullable=True)
    notas: Mapped[str | None] = mapped_column(Text(), nullable=True)
    fecha_evaluacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    registro: Mapped["ServicioReguladoRegistro"] = relationship(
        back_populates="estados_cumplimiento"
    )
