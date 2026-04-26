"""ValidationRule model — dynamic validation rules (Fase 5)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.user import User


class ValidationRule(SoftDeleteMixin, Base):
    """
    Dynamic validation rules for entities (e.g., vulnerabilities, releases).
    Allows admins to define custom validations without code changes.
    """

    __tablename__ = "validation_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Entity type (e.g., "vulnerabilidad", "service_release", "iniciativa")
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    
    # Rule name (e.g., "Críticas deben tener SLA <= 7 días")
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Rule type: "required", "regex", "conditional", "formula"
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Condition JSON (structure varies by rule_type)
    # Example: {"field": "severidad", "op": "==", "value": "CRITICA", "then_check": {...}}
    condition: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    
    # Error message to display
    error_message: Mapped[str] = mapped_column(String(500), nullable=False)
    
    # Enabled flag
    enabled: Mapped[bool] = mapped_column(default=True)
    
    # Creator
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    creator: Mapped[User] = relationship("User", lazy="joined", foreign_keys=[created_by])
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    def __repr__(self) -> str:
        return f"<ValidationRule {self.nombre} (entity={self.entity_type}, type={self.rule_type})>"
