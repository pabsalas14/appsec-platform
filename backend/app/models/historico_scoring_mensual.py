"""Historico de scoring mensual — motor de madurez global (spec 12, Bloque 8).

Agrega los 4 pilares por alcance jerárquico y persiste snapshot mensual auditable.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class HistoricoScoringMensual(Base):
    """Snapshot de scoring por mes y alcance (celula … global).

    scope_kind:
      celula | organizacion | gerencia | subdireccion | direccion | global
    scope_id:
      ID de la entidad en ese nivel. Para global se usa el user_id del tenant (dueño de datos).
    """

    __tablename__ = "historico_scoring_mensuals"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "anio",
            "mes",
            "scope_kind",
            "scope_id",
            name="uq_historico_scoring_mensual_scope",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    anio: Mapped[int] = mapped_column(Integer(), nullable=False, index=True)
    mes: Mapped[int] = mapped_column(Integer(), nullable=False, index=True)  # 1-12

    scope_kind: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    scope_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    score_total: Mapped[float] = mapped_column(Float(), nullable=False)
    score_vulnerabilidades: Mapped[float] = mapped_column(Float(), nullable=False)
    score_programas: Mapped[float] = mapped_column(Float(), nullable=False)
    score_iniciativas: Mapped[float] = mapped_column(Float(), nullable=False)
    score_okrs: Mapped[float] = mapped_column(Float(), nullable=False)

    pesos_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    detalle_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    notas: Mapped[str | None] = mapped_column(Text(), nullable=True)
