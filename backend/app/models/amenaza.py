"""Amenaza model — amenaza identificada en sesión de Threat Modeling STRIDE/DREAD (Módulo 3.3).

score_total = (damage + reproducibility + exploitability + affected_users + discoverability) / 5
Se calcula automáticamente en el service al crear/actualizar.
"""

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
    from app.models.control_mitigacion import ControlMitigacion
    from app.models.sesion_threat_modeling import SesionThreatModeling


class Amenaza(SoftDeleteMixin, Base):
    __tablename__ = "amenazas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sesion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sesion_threat_modelings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    # STRIDE: Spoofing | Tampering | Repudiation | Info Disclosure | DoS | Elevation
    categoria_stride: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # DREAD scoring (1-10 cada uno)
    dread_damage: Mapped[int] = mapped_column(Integer(), nullable=False)
    dread_reproducibility: Mapped[int] = mapped_column(Integer(), nullable=False)
    dread_exploitability: Mapped[int] = mapped_column(Integer(), nullable=False)
    dread_affected_users: Mapped[int] = mapped_column(Integer(), nullable=False)
    dread_discoverability: Mapped[int] = mapped_column(Integer(), nullable=False)
    # Calculado automáticamente: promedio de los 5 DREAD scores
    score_total: Mapped[float | None] = mapped_column(Float(), nullable=True)
    # estado: Identificada | En Mitigacion | Mitigada | Aceptada
    estado: Mapped[str] = mapped_column(String(50), nullable=False, default="Identificada")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    sesion: Mapped[SesionThreatModeling] = relationship(back_populates="amenazas")
    controles: Mapped[list[ControlMitigacion]] = relationship(
        "ControlMitigacion", back_populates="amenaza", lazy="noload"
    )
