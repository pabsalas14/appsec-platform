"""Configuración LLM para SCR — API key cifrada en reposo."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.encryption import EncryptedString
from app.database import Base
from app.models.mixins import SoftDeleteMixin


class ScrLlmConfiguration(SoftDeleteMixin, Base):
    """Claves LLM por plataforma (``user_id`` NULL = uso global SCR)."""

    __tablename__ = "scr_llm_configurations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(255), nullable=False)
    base_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    api_key_secret: Mapped[str] = mapped_column(EncryptedString, nullable=False)
    api_key_hint: Mapped[str] = mapped_column(String(16), nullable=False, server_default=text("'****'"))

    temperature: Mapped[float] = mapped_column(Float(), nullable=False, server_default=text("0.3"))
    max_tokens: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("4096"))
    timeout_seconds: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("300"))

    is_default: Mapped[bool] = mapped_column(Boolean(), nullable=False, server_default=text("false"))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )
