"""ConfiguracionIA model — IA provider configuration (multi-provider, encrypted keys).

Stores API credentials for IA providers (anthropic, openai) with encryption.
Supports temperature, max_tokens and per-provider settings.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ConfiguracionIA(Base):
    __tablename__ = "configuracion_ia"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    provider: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    api_key_encrypted: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String(256), nullable=False)
    temperatura: Mapped[float] = mapped_column(Float, nullable=False, default=0.7)
    max_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=4096)
    enabled: Mapped[bool] = mapped_column(default=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    __table_args__ = (
        ("IX_configuracion_ia_provider_enabled", "CREATE INDEX ix_configuracion_ia_provider_enabled ON configuracion_ia(provider, enabled)"),
    )
