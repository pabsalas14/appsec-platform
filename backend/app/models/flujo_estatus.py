"""FlujoEstatus model — dynamic state transitions (Fase 14)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Boolean, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.user import User


class FlujoEstatus(SoftDeleteMixin, Base):
    __tablename__ = "flujos_estatus"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    from_status: Mapped[str] = mapped_column(String(100), nullable=False)
    to_status: Mapped[str] = mapped_column(String(100), nullable=False)
    allowed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    requires_justification: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    requires_approval: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship(back_populates="flujos_estatus")
