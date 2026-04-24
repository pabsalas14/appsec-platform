"""RevisionSourceCode model — revisión de un control de código en un programa (Módulo 3.4).

La evidencia tiene hash SHA-256 para garantizar integridad (A3).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.programa_source_code import ProgramaSourceCode
    from app.models.control_source_code import ControlSourceCode


class RevisionSourceCode(SoftDeleteMixin, Base):
    __tablename__ = "revision_source_codes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    programa_sc_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("programa_source_codes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    control_sc_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("control_source_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    fecha_revision: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # resultado: Cumple | No Cumple | Parcial | No Aplica
    resultado: Mapped[str] = mapped_column(String(50), nullable=False)
    # Evidencia con integridad SHA-256 (A3)
    evidencia_filename: Mapped[str | None] = mapped_column(String(500), nullable=True)
    evidencia_sha256: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    notas: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    programa_sc: Mapped["ProgramaSourceCode"] = relationship(back_populates="revisiones")
    control_sc: Mapped["ControlSourceCode"] = relationship(back_populates="revisiones")
