"""OkrRevisionQ model — owned per-user entity."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import SoftDeleteMixin


class OkrRevisionQ(SoftDeleteMixin, Base):
    __tablename__ = "okr_revision_qs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subcompromiso_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("okr_subcompromisos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quarter: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    avance_reportado: Mapped[float] = mapped_column(Float(), nullable=False)
    avance_validado: Mapped[float | None] = mapped_column(Float(), nullable=True)
    comentario_colaborador: Mapped[str | None] = mapped_column(Text(), nullable=True)
    feedback_evaluador: Mapped[str | None] = mapped_column(Text(), nullable=True)
    estado: Mapped[str] = mapped_column(String(255), nullable=False, index=True, server_default=text("'draft'"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )
