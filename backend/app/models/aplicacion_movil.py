"""AplicacionMovil model — owned per-user entity."""

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.celula import Celula


class AplicacionMovil(SoftDeleteMixin, Base):
    __tablename__ = "aplicacion_movils"

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
    plataforma: Mapped[str] = mapped_column(String(50), nullable=False)
    bundle_id: Mapped[str] = mapped_column(String(255), nullable=False)
    celula_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("celulas.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    celula: Mapped["Celula"] = relationship(back_populates="aplicacion_movils")
    vulnerabilidades: Mapped[list["Vulnerabilidad"]] = relationship(
        "Vulnerabilidad", back_populates="aplicacion_movil", lazy="noload"
    )
