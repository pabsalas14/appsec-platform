"""AgenteConfig model — Configurable agent patterns and prompts for LLM-based analysis.

Stores customizable patterns and system prompts for Inspector, Fiscal, and Detective agents.
Supports per-user or per-review customization patterns.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import DateTime, Index, String, Text, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AgenteConfig(Base):
    """Configuración personalizable para agentes de análisis de código."""

    __tablename__ = "agente_config"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Identificación del agente
    agente_tipo: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # inspector, fiscal, detective

    # Ámbito de aplicación (opcional)
    usuario_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    revision_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)

    # Configuración de patrones (JSON)
    patrones_personalizados: Mapped[Optional[Dict[str, str]]] = mapped_column(JSONB, nullable=True)

    # Prompt del sistema personalizado
    prompt_sistema_personalizado: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Parámetros de LLM personalizados
    parametros_llm: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Proveedor LLM preferido
    proveedor_preferido: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Estado
    activo: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Timestamps
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Índices para búsquedas eficientes
    __table_args__ = (
        Index("ix_agente_config_tipo_usuario", "agente_tipo", "usuario_id"),
        Index("ix_agente_config_tipo_revision", "agente_tipo", "revision_id"),
    )

    def __repr__(self) -> str:
        return f"<AgenteConfig {self.agente_tipo} user={self.usuario_id} review={self.revision_id}>"
