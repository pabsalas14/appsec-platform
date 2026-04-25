"""HallazgoMAST model — finding from MAST execution, optionally linked to Vulnerabilidad (Módulo 4)."""

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
    from app.models.ejecucion_mast import EjecucionMAST


class HallazgoMAST(SoftDeleteMixin, Base):
    __tablename__ = "hallazgo_masts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ejecucion_mast_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ejecucion_masts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vulnerabilidad_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    severidad: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    cwe: Mapped[str | None] = mapped_column(String(50), nullable=True)
    owasp_categoria: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    ejecucion: Mapped[EjecucionMAST] = relationship(back_populates="hallazgos")
    # vulnerabilidad_id se vinculará en Módulo 9 cuando se complete la gestión de Vulnerabilidades
