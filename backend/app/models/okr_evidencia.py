"""OkrEvidencia model — owned per-user entity."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import SoftDeleteMixin


class OkrEvidencia(SoftDeleteMixin, Base):
    __tablename__ = "okr_evidencias"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    revision_q_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("okr_revision_qs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attachment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("attachments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    url_evidencia: Mapped[str | None] = mapped_column(String(512), nullable=True)
    nombre_archivo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tipo_evidencia: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )
