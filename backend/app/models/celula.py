"""Celula model — bajo organización de plataforma (BRD §3.1)."""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.activo_web import ActivoWeb
    from app.models.aplicacion_movil import AplicacionMovil
    from app.models.organizacion import Organizacion
    from app.models.repositorio import Repositorio
    from app.models.servicio import Servicio


class Celula(SoftDeleteMixin, Base):
    __tablename__ = "celulas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    organizacion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizacions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    organizacion: Mapped["Organizacion"] = relationship(back_populates="celulas")
    repositorios: Mapped[list["Repositorio"]] = relationship(back_populates="celula")
    activo_webs: Mapped[list["ActivoWeb"]] = relationship(back_populates="celula")
    servicios: Mapped[list["Servicio"]] = relationship(back_populates="celula")
    aplicacion_movils: Mapped[list["AplicacionMovil"]] = relationship(back_populates="celula")
