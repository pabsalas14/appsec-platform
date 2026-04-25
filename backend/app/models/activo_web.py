"""ActivoWeb model — owned per-user entity."""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.celula import Celula
    from app.models.programa_dast import ProgramaDast
    from app.models.programa_threat_modeling import ProgramaThreatModeling
    from app.models.revision_tercero import RevisionTercero
    from app.models.vulnerabilidad import Vulnerabilidad


class ActivoWeb(SoftDeleteMixin, Base):
    __tablename__ = "activo_webs"
    __table_args__ = (
        UniqueConstraint("user_id", "url", name="uq_activo_webs_user_url"),
    )

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
    url: Mapped[str] = mapped_column(String(255), nullable=False)
    ambiente: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(255), nullable=False)
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
        onupdate=lambda: datetime.now(UTC),
    )

    celula: Mapped["Celula"] = relationship(back_populates="activo_webs")
    vulnerabilidades: Mapped[list["Vulnerabilidad"]] = relationship(
        "Vulnerabilidad", back_populates="activo_web", lazy="noload"
    )
    revision_terceros: Mapped[list["RevisionTercero"]] = relationship(
        "RevisionTercero", back_populates="activo_web", lazy="noload"
    )
    programas_dast: Mapped[list["ProgramaDast"]] = relationship(
        "ProgramaDast", back_populates="activo_web", lazy="noload"
    )
    programas_threat_modeling: Mapped[list["ProgramaThreatModeling"]] = relationship(
        "ProgramaThreatModeling", back_populates="activo_web", lazy="noload"
    )
