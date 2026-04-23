"""HerramientaExterna model — A5-compliant encrypted credentials and A2 soft delete."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, ForeignKey, text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import SoftDeleteMixin
from app.core.encryption import EncryptedString


class HerramientaExterna(Base, SoftDeleteMixin):
    __tablename__ = "herramienta_externas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(255), nullable=False)
    url_base: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # [A5] Mandatory At-Rest Encryption — Stored ciphertext, Loaded as plaintext
    api_token: Mapped[str | None] = mapped_column(EncryptedString, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        CheckConstraint(
            tipo.in_(['SAST', 'DAST', 'SCA', 'TM', 'MAST', 'Terceros', 'CI/CD', 'BugBounty', 'VulnerabilityManager']),
            name="chk_herramienta_externa_tipo_valido",
        ),
    )
