"""Formula model — admin-managed reusable formulas (Fase 5)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    pass


class Formula(SoftDeleteMixin, Base):
    """
    Admin-managed reusable formulas for dynamic calculations.
    Independent from IndicadorFormula (which are user-owned metrics).
    """

    __tablename__ = "formulas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Formula name
    nombre: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    
    # Optional description
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    
    # Formula expression (using safe formula_engine)
    formula_text: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Execution engine (default: formula_engine)
    motor: Mapped[str] = mapped_column(String(100), default="formula_engine", nullable=False)
    
    # Enable/disable flag
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Timestamps
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

    def __repr__(self) -> str:
        return f"<Formula {self.nombre} (engine={self.motor})>"
