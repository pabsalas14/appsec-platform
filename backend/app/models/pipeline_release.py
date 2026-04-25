"""PipelineRelease model — ejecución SAST/DAST/SCA en CI/CD (Módulo 8).

Vinculado a un Repositorio y opcionalmente a un ServiceRelease.
Los hallazgos que fallen pueden promover una Vulnerabilidad.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.hallazgo_pipeline import HallazgoPipeline
    from app.models.repositorio import Repositorio
    from app.models.service_release import ServiceRelease


class PipelineRelease(SoftDeleteMixin, Base):
    __tablename__ = "pipeline_releases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Opcional: si este pipeline está asociado a un ServiceRelease
    service_release_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("service_releases.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    repositorio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("repositorios.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    rama: Mapped[str] = mapped_column(String(255), nullable=False)
    commit_sha: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # tipo: SAST | DAST | SCA
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    # resultado: Pendiente | En Progreso | Exitoso | Fallido | Cancelado
    resultado: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Pendiente"
    )
    herramienta: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    # ─── Relationships ─────────────────────────────────────────────────────────
    service_release: Mapped[ServiceRelease | None] = relationship(
        back_populates="pipelines"
    )
    repositorio: Mapped[Repositorio] = relationship(back_populates="pipeline_releases")
    hallazgos: Mapped[list[HallazgoPipeline]] = relationship(
        "HallazgoPipeline", back_populates="pipeline_release", lazy="noload"
    )
