"""OkrSubcompromiso model — owned per-user entity."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import SoftDeleteMixin


class OkrSubcompromiso(SoftDeleteMixin, Base):
    __tablename__ = "okr_subcompromisos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    compromiso_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("okr_compromisos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    nombre_sub_item: Mapped[str] = mapped_column(String(255), nullable=False)
    resultado_esperado: Mapped[str | None] = mapped_column(Text(), nullable=True)
    peso_interno: Mapped[float] = mapped_column(Float(), nullable=False)
    evidencia_requerida: Mapped[bool] = mapped_column(Boolean(), nullable=False, server_default=text("false"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )
