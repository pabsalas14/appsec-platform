"""AI Automation Rules — FASE 8 (Triggers + Actions configurables)."""

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import SoftDeleteMixin


class AIRule(SoftDeleteMixin, Base):
    __tablename__ = "ai_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # TRIGGER CONFIGURATION
    trigger_type: Mapped[str] = mapped_column(
        String(128), 
        nullable=False, 
        index=True,
        comment="on_vulnerability_created, on_vulnerability_status_changed, on_release_created, on_theme_created, on_sla_at_risk, cron"
    )
    trigger_config: Mapped[Any] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
        comment="Trigger-specific config (e.g., cron schedule, severity filter)"
    )
    
    # ACTION CONFIGURATION
    action_type: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
        comment="send_notification, create_ticket, assign_to_user, tag_entity, generate_summary, enrich_data, suggest_fix"
    )
    action_config: Mapped[Any] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
        comment="Action-specific config (e.g., template, user_id, tags)"
    )
    
    # CONTROL
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    max_retries: Mapped[int] = mapped_column(default=3)
    timeout_seconds: Mapped[int] = mapped_column(default=30)
    
    # AUDIT
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

