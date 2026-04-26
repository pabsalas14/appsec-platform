"""AIAutomationRule model — rules for IA-driven automation (trigger → action)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.mixins import SoftDeleteMixin
from app.database import Base


class AIAutomationRule(Base, SoftDeleteMixin):
    __tablename__ = "ai_automation_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    nombre: Mapped[str] = mapped_column(String(256), nullable=False)

    trigger_type: Mapped[str] = mapped_column(String(128), nullable=False, index=True)

    trigger_config: Mapped[Any] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )

    action_type: Mapped[str] = mapped_column(String(128), nullable=False, index=True)

    action_config: Mapped[Any] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )

    enabled: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

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
        Index("ix_ai_automation_rule_trigger_enabled", "trigger_type", "enabled", postgresql_where=text("deleted_at IS NULL")),
    )
