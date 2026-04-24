"""EvidenciaRegulacion model — evidencia de cumplimiento regulatorio (Módulo 3.5).

sha256 almacena la integridad del archivo de evidencia (A3).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.servicio_regulado_registro import ServicioReguladoRegistro


class EvidenciaRegulacion(SoftDeleteMixin, Base):
    __tablename__ = "evidencia_regulacions"

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
    descripcion: Mapped[str] = mapped_column(Text(), nullable=False)
    filename: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # SHA-256 para integridad del archivo (A3)
    sha256: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    registro: Mapped["ServicioReguladoRegistro"] = relationship(back_populates="evidencias")
