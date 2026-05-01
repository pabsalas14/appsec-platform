"""Modelo para configuraciones personalizadas de scoring de riesgo."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RiskScoringConfig(Base):
    """Permite a admins customize risk scoring weights."""

    __tablename__ = "risk_scoring_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre_config: Mapped[str] = mapped_column(String(256), nullable=False)
    patron_peso: Mapped[dict] = mapped_column(JSONB(), nullable=False, server_default=text("'{}'::jsonb"))
    weight_hidden_commits: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("10"))
    weight_timing_anomalies: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("15"))
    weight_critical_files: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("20"))
    weight_mass_changes: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("15"))
    weight_author_anomalies: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("15"))
    weight_rapid_succession: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("10"))
    weight_force_push: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("25"))
    weight_dependency_changes: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("20"))
    weight_external_merges: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("15"))
    activa: Mapped[bool] = mapped_column(server_default=text("true"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )
