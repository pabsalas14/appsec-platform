"""Token GitHub/GitLab para SCR — cifrado en reposo (A5)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.encryption import EncryptedString
from app.database import Base
from app.models.mixins import SoftDeleteMixin


class ScrGitHubToken(SoftDeleteMixin, Base):
    """PAT almacenado en plataforma (global si ``user_id`` es NULL)."""

    __tablename__ = "scr_github_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str] = mapped_column(String(32), nullable=False, server_default=text("'github'"))

    token_secret: Mapped[str] = mapped_column(EncryptedString, nullable=False)
    token_hint: Mapped[str] = mapped_column(String(16), nullable=False, server_default=text("'****'"))

    user_github: Mapped[str | None] = mapped_column(String(255), nullable=True)
    org_count: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("0"))
    repo_count: Mapped[int] = mapped_column(Integer(), nullable=False, server_default=text("0"))
    organizations_list: Mapped[list | None] = mapped_column(JSONB(), nullable=True)

    expiration_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_validated: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )
