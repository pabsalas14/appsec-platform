"""PlanRemediacion model — remediation plan for audit findings (Módulo 6)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, ForeignKey, String, Table, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.auditoria import Auditoria
    from app.models.vulnerabilidad import Vulnerabilidad


plan_remediacion_vulnerabilidads = Table(
    "plan_remediacion_vulnerabilidads",
    Base.metadata,
    Column(
        "plan_remediacion_id",
        UUID(as_uuid=True),
        ForeignKey("planes_remediacion.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "vulnerabilidad_id",
        UUID(as_uuid=True),
        ForeignKey("vulnerabilidads.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class PlanRemediacion(SoftDeleteMixin, Base):
    __tablename__ = "planes_remediacion"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    auditoria_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("auditorias.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    descripcion: Mapped[str] = mapped_column(Text(), nullable=False)
    acciones_recomendadas: Mapped[str] = mapped_column(Text(), nullable=False)
    responsable: Mapped[str] = mapped_column(String(255), nullable=False)
    fecha_limite: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estado: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    auditoria: Mapped[Auditoria] = relationship(back_populates="planes_remediacion")
    vulnerabilidades: Mapped[list["Vulnerabilidad"]] = relationship(
        "Vulnerabilidad",
        secondary=plan_remediacion_vulnerabilidads,
        lazy="noload",
    )
