"""EmailLog model — audit trail for email notifications (S18)."""

import uuid
from datetime import UTC, datetime
from typing import Literal

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EmailLog(Base):
    """Audit log for email delivery attempts."""

    __tablename__ = "email_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    notificacion_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notificacions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    email_template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("email_templates.id", ondelete="RESTRICT"),
        nullable=False,
    )
    destinatario: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    asunto: Mapped[str] = mapped_column(String(255), nullable=False)
    estado: Mapped[Literal["pendiente", "enviado", "fallido"]] = mapped_column(
        Enum("pendiente", "enviado", "fallido", name="email_log_estado"),
        nullable=False,
        default="pendiente",
        server_default=text("'pendiente'"),
        index=True,
    )
    # número de reintentos realizados
    reintentos: Mapped[int] = mapped_column(Integer(), nullable=False, default=0, server_default=text("0"))
    # último error SMTP o excepción
    error_mensaje: Mapped[str | None] = mapped_column(Text(), nullable=True)
    # timestamp último intento
    ultimo_intento_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # timestamp envío exitoso
    enviado_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )
