"""ServiceRelease model — ciclo de vida de un release de servicio (Módulo 8).

Aplica:
  - SoftDeleteMixin (A2)
  - audit_action_prefix="service_release" (A5)
  - SoD configurable en aprobación de etapas (A6) — ver EtapaRelease
"""

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
    from app.models.etapa_release import EtapaRelease
    from app.models.pipeline_release import PipelineRelease
    from app.models.servicio import Servicio


class ServiceRelease(SoftDeleteMixin, Base):
    __tablename__ = "service_releases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    servicio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("servicios.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    # Estado derivado del flujo de etapas; se actualiza al avanzar etapas
    estado_actual: Mapped[str] = mapped_column(String(100), nullable=False, default="Borrador")
    jira_referencia: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    # ─── Relationships ─────────────────────────────────────────────────────────
    servicio: Mapped[Servicio] = relationship(back_populates="service_releases")
    etapas: Mapped[list[EtapaRelease]] = relationship("EtapaRelease", back_populates="service_release", lazy="noload")
    pipelines: Mapped[list[PipelineRelease]] = relationship(
        "PipelineRelease", back_populates="service_release", lazy="noload"
    )
