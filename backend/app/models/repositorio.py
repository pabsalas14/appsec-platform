"""Repositorio model — owned per-user entity."""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.celula import Celula
    from app.models.pipeline_release import PipelineRelease
    from app.models.programa_sast import ProgramaSast
    from app.models.programa_source_code import ProgramaSourceCode
    from app.models.vulnerabilidad import Vulnerabilidad


class Repositorio(SoftDeleteMixin, Base):
    __tablename__ = "repositorios"
    __table_args__ = (
        UniqueConstraint("user_id", "url", name="uq_repositorios_user_url"),
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
    plataforma: Mapped[str] = mapped_column(String(255), nullable=False)
    rama_default: Mapped[str] = mapped_column(String(255), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
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

    celula: Mapped["Celula"] = relationship(back_populates="repositorios")
    vulnerabilidades: Mapped[list["Vulnerabilidad"]] = relationship(
        "Vulnerabilidad", back_populates="repositorio", lazy="noload"
    )
    pipeline_releases: Mapped[list["PipelineRelease"]] = relationship(
        "PipelineRelease", back_populates="repositorio", lazy="noload"
    )
    programas_sast: Mapped[list["ProgramaSast"]] = relationship(
        "ProgramaSast", back_populates="repositorio", lazy="noload"
    )
    programas_source_code: Mapped[list["ProgramaSourceCode"]] = relationship(
        "ProgramaSourceCode", back_populates="repositorio", lazy="noload"
    )
