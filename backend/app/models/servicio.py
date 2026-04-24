"""Servicio model — owned per-user entity."""

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.celula import Celula
    from app.models.service_release import ServiceRelease
    from app.models.revision_tercero import RevisionTercero
    from app.models.programa_threat_modeling import ProgramaThreatModeling
    from app.models.servicio_regulado_registro import ServicioReguladoRegistro


class Servicio(SoftDeleteMixin, Base):
    __tablename__ = "servicios"

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
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    criticidad: Mapped[str] = mapped_column(String(50), nullable=False)
    tecnologia_stack: Mapped[str | None] = mapped_column(Text(), nullable=True)
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

    celula: Mapped["Celula"] = relationship(back_populates="servicios")
    vulnerabilidades: Mapped[list["Vulnerabilidad"]] = relationship(
        "Vulnerabilidad", back_populates="servicio", lazy="noload"
    )
    service_releases: Mapped[list["ServiceRelease"]] = relationship(
        "ServiceRelease", back_populates="servicio", lazy="noload"
    )
    revision_terceros: Mapped[list["RevisionTercero"]] = relationship(
        "RevisionTercero", back_populates="servicio", lazy="noload"
    )
    programas_threat_modeling: Mapped[list["ProgramaThreatModeling"]] = relationship(
        "ProgramaThreatModeling", back_populates="servicio", lazy="noload"
    )
    registros_regulacion: Mapped[list["ServicioReguladoRegistro"]] = relationship(
        "ServicioReguladoRegistro", back_populates="servicio", lazy="noload"
    )
