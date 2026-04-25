"""ProgramaSourceCode model — programa de seguridad en código fuente (Módulo 3.4).

Registra revisiones de controles manuales: branch protection, code signing,
secret scanning, dependency review, etc. (no integración con APIs).
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.repositorio import Repositorio
    from app.models.revision_source_code import RevisionSourceCode


class ProgramaSourceCode(SoftDeleteMixin, Base):
    __tablename__ = "programa_source_codes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    repositorio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("repositorios.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    ano: Mapped[int] = mapped_column(Integer(), nullable=False, index=True)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    estado: Mapped[str] = mapped_column(String(50), nullable=False, default="Activo")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    repositorio: Mapped[Repositorio] = relationship(back_populates="programas_source_code")
    revisiones: Mapped[list[RevisionSourceCode]] = relationship(
        "RevisionSourceCode", back_populates="programa_sc", lazy="noload"
    )
