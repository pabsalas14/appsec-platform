"""EmailTemplate model — HTML templates for notification emails (S18)."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EmailTemplate(Base):
    """Email template with variables interpolation support."""

    __tablename__ = "email_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    asunto: Mapped[str] = mapped_column(String(255), nullable=False)
    cuerpo_html: Mapped[str] = mapped_column(Text(), nullable=False)
    variables: Mapped[list[str] | None] = mapped_column(
        # JSON list of variable names like ["titulo", "descripcion", "enlace"]
        # For interpolation: {{ variable_name }}
    )
    descripcion: Mapped[str | None] = mapped_column(Text(), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )
