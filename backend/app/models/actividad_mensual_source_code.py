"""ActividadMensualSourceCode model — actividad mensual de Source Code (BRD §5.4)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.programa_source_code import ProgramaSourceCode


class ActividadMensualSourceCode(SoftDeleteMixin, Base):
    __tablename__ = "actividad_mensual_source_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    programa_source_code_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("programa_source_codes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    mes: Mapped[int] = mapped_column(Integer(), nullable=False)
    ano: Mapped[int] = mapped_column(Integer(), nullable=False, index=True)
    total_hallazgos: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    criticos: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    altos: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    medios: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    bajos: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    sub_estado: Mapped[str | None] = mapped_column(String(100), nullable=True)
    score: Mapped[float | None] = mapped_column(Float(), nullable=True)
    notas: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    programa_source_code: Mapped[ProgramaSourceCode] = relationship(back_populates="actividades")
