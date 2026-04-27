"""Subdireccion model — primer nivel jerárquico BRD §3.1 (sin padre organización)."""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.direccion import Direccion
    from app.models.gerencia import Gerencia


class Subdireccion(SoftDeleteMixin, Base):
    __tablename__ = "subdireccions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    direccion_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("direccions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    codigo: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    director_nombre: Mapped[str | None] = mapped_column(String(255), nullable=True)
    director_contacto: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    direccion: Mapped["Direccion"] = relationship(back_populates="subdirecciones")
    gerencias: Mapped[list["Gerencia"]] = relationship(back_populates="subdireccion")
