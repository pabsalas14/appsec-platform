"""ControlMitigacion model — control de mitigación para una amenaza TM (Módulo 3.3)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.amenaza import Amenaza
    from app.models.user import User


class ControlMitigacion(SoftDeleteMixin, Base):
    __tablename__ = "control_mitigacions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amenaza_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("amenazas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    # tipo: Preventivo | Detectivo | Correctivo | Disuasivo
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    # estado: Pendiente | En Implementacion | Implementado | Verificado
    estado: Mapped[str] = mapped_column(String(50), nullable=False, default="Pendiente")
    responsable_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    amenaza: Mapped[Amenaza] = relationship(back_populates="controles")
    responsable: Mapped[User | None] = relationship("User", foreign_keys=[responsable_id], lazy="noload")
