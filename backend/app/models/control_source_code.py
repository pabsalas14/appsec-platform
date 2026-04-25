"""ControlSourceCode model — control de seguridad evaluable en revisión de código (Módulo 3.4).

Catálogo de controles: branch protection, code signing, secret scanning, etc.
Sin owner_field — son un catálogo global del sistema.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.revision_source_code import RevisionSourceCode


class ControlSourceCode(SoftDeleteMixin, Base):
    __tablename__ = "control_source_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    # tipo: Branch Protection | Code Signing | Secret Scanning | Dependency Review | Otro
    tipo: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    obligatorio: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    revisiones: Mapped[list[RevisionSourceCode]] = relationship(
        "RevisionSourceCode", back_populates="control_sc", lazy="noload"
    )
