"""SystemCatalog model — hierarchical key/value catalog for system-wide classifications.

Used to store enumeration-like data (tipos, valores, configuraciones) in a flexible,
database-backed manner without requiring schema changes. Supports hierarchical keys
and active/inactive toggling.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SystemCatalog(Base):
    __tablename__ = "system_catalogs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    key: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    values: Mapped[Any] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    activo: Mapped[bool] = mapped_column(default=True, index=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
        index=True,
    )

    __table_args__ = (
        ("UQ_system_catalog_tipo_key", "UNIQUE (tipo, key)"),
    )
