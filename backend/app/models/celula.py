"""Celula model — owned per-user entity."""

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.activo_web import ActivoWeb
    from app.models.aplicacion_movil import AplicacionMovil
    from app.models.repositorio import Repositorio
    from app.models.servicio import Servicio
    from app.models.subdireccion import Subdireccion


class Celula(SoftDeleteMixin, Base):
    __tablename__ = "celulas"

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
    tipo: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    subdireccion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subdireccions.id", ondelete="RESTRICT"),
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

    subdireccion: Mapped["Subdireccion"] = relationship(back_populates="celulas")
    repositorios: Mapped[list["Repositorio"]] = relationship(back_populates="celula")
    activo_webs: Mapped[list["ActivoWeb"]] = relationship(back_populates="celula")
    servicios: Mapped[list["Servicio"]] = relationship(back_populates="celula")
    aplicacion_movils: Mapped[list["AplicacionMovil"]] = relationship(back_populates="celula")
