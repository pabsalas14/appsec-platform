"""Custom Fields — FASE 4.

Permite admin agregar campos dinámicos a entidades sin tocar BD.
Cada entidad (vulnerabilidad, iniciativa, etc) puede tener N custom fields.
Los valores se almacenan en una tabla separada `custom_field_values`.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import SoftDeleteMixin


class CustomField(SoftDeleteMixin, Base):
    """Definición de un campo personalizado."""

    __tablename__ = "custom_fields"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    field_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # text, number, date, select, boolean, url, user_ref
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_required: Mapped[bool] = mapped_column(default=False)
    is_searchable: Mapped[bool] = mapped_column(default=False)
    order: Mapped[int] = mapped_column(Integer, default=0, index=True)  # Para reorder
    config: Mapped[str] = mapped_column(Text, nullable=True)  # JSON: {options, default_value, pattern, etc}

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )


class CustomFieldValue(SoftDeleteMixin, Base):
    """Valores de custom fields por entidad (user_id relaciones por ej si entity_type=user)."""

    __tablename__ = "custom_field_values"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    field_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)  # FK custom_fields.id
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )  # ID of vulnerabilidad, iniciativa, etc
    value: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON serializado (string, number, date, bool, etc)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )
