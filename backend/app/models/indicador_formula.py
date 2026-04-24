"""IndicadorFormula model — dynamic indicators and scoring formulas (Fase 15)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, String, Float, ForeignKey, text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.user import User


class IndicadorFormula(SoftDeleteMixin, Base):
    __tablename__ = "indicadores_formulas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    motor: Mapped[str] = mapped_column(String(100), nullable=False)
    formula: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    sla_config: Mapped[dict[str, int]] = mapped_column(JSON, nullable=True)
    threshold_green: Mapped[float] = mapped_column(Float, nullable=True)
    threshold_yellow: Mapped[float] = mapped_column(Float, nullable=True)
    threshold_red: Mapped[float] = mapped_column(Float, nullable=True)
    periodicidad: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship(back_populates="indicadores_formulas")
