"""Dashboard Export Log model."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DashboardExportLog(Base):
    """Log de exportaciones de dashboards."""

    __tablename__ = "dashboard_export_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    dashboard_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    export_format: Mapped[str] = mapped_column(String(20), nullable=False, description="pdf, csv, json")
    filtros: Mapped[str | None] = mapped_column(String(500), nullable=True)
    registro_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    )
