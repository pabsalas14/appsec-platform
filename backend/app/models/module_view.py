"""ModuleView model — personalized views for modules (table, kanban, calendar, cards) — Fase 3."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.user import User


class ModuleView(SoftDeleteMixin, Base):
    """
    Personalized views for modules (table, kanban, calendar, cards).
    Allows users to configure custom column layouts, filters, sorts.
    """

    __tablename__ = "module_views"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Module reference (e.g., "vulnerabilities", "releases", "iniciativas")
    module_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    
    # View name (e.g., "Críticas SLA Vencido")
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # View type: "table", "kanban", "calendar", "cards"
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Columns configuration (JSON): [{"field": "titulo", "width": 300, "order": 0, "sortable": true}, ...]
    columns_config: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, server_default="{}")
    
    # Filters (JSON): {"severidad": ["CRITICA"], "estado": "Abierta"}
    filters: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, server_default="{}")
    
    # Sort configuration (JSON): {"field": "created_at", "direction": "DESC"}
    sort_by: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, server_default="{}")
    
    # Group by field (optional)
    group_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Page size (default 25)
    page_size: Mapped[int] = mapped_column(default=25)
    
    # Owner
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    user: Mapped[User] = relationship("User", lazy="joined")
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    def __repr__(self) -> str:
        return f"<ModuleView {self.nombre} (module={self.module_name}, tipo={self.tipo})>"
