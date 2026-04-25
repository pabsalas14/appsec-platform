"""Vulnerabilidad model — ciclo de vida unificado de hallazgos (Módulo 9).

Fuentes: SAST | DAST | SCA | TM | MAST | Auditoria | Tercero
Activo afectado: uno de repositorio_id / activo_web_id / servicio_id / aplicacion_movil_id
(exactamente uno debe estar presente — validado en service/schema, no en DB constraint).

Aplica:
  - SoftDeleteMixin (A2)
  - audit_action_prefix="vulnerabilidad" (A5)
  - SLA calculado automáticamente desde config al crear (sla.severidades)
  - Semáforo de vencimiento derivado de fecha_limite_sla vs now()
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SoftDeleteMixin

if TYPE_CHECKING:
    from app.models.aceptacion_riesgo import AceptacionRiesgo
    from app.models.activo_web import ActivoWeb
    from app.models.aplicacion_movil import AplicacionMovil
    from app.models.evidencia_remediacion import EvidenciaRemediacion
    from app.models.excepcion_vulnerabilidad import ExcepcionVulnerabilidad
    from app.models.hallazgo_dast import HallazgoDast
    from app.models.hallazgo_pipeline import HallazgoPipeline
    from app.models.hallazgo_sast import HallazgoSast
    from app.models.hallazgo_tercero import HallazgoTercero
    from app.models.historial_vulnerabilidad import HistorialVulnerabilidad
    from app.models.repositorio import Repositorio
    from app.models.servicio import Servicio
    from app.models.user import User


class Vulnerabilidad(SoftDeleteMixin, Base):
    __tablename__ = "vulnerabilidads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Dueño del registro (analista que lo creó / importó)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Datos del hallazgo ───────────────────────────────────────────────────
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)

    # fuente: SAST | DAST | SCA | TM | MAST | Auditoria | Tercero
    fuente: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    # severidad: Critica | Alta | Media | Baja (valores de catálogo sla.severidades)
    severidad: Mapped[str] = mapped_column(String(32), nullable=False, index=True)

    # estado: flujo configurable desde catalogo.estatus_vulnerabilidad
    estado: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    # Métricas de riesgo (opcionales)
    cvss_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    cwe_id: Mapped[str | None] = mapped_column(String(16), nullable=True)
    owasp_categoria: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # SLA — calculado automáticamente en service.create() desde config
    fecha_limite_sla: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)

    # ── Responsable de remediación ──────────────────────────────────────────
    responsable_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── Activo afectado (polymorphic — exactamente uno) ─────────────────────
    repositorio_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("repositorios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    activo_web_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("activo_webs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    servicio_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("servicios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    aplicacion_movil_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("aplicacion_movils.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── Timestamps ──────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(UTC),
    )

    # P2 — campos adicionales configurables (no alteran columnas core ni scoring)
    custom_fields: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    # ── Relationships ────────────────────────────────────────────────────────
    creator: Mapped[User] = relationship("User", foreign_keys=[user_id], lazy="noload")
    responsable: Mapped[User | None] = relationship("User", foreign_keys=[responsable_id], lazy="noload")
    repositorio: Mapped[Repositorio | None] = relationship(
        "Repositorio", back_populates="vulnerabilidades", lazy="noload"
    )
    activo_web: Mapped[ActivoWeb | None] = relationship("ActivoWeb", back_populates="vulnerabilidades", lazy="noload")
    servicio: Mapped[Servicio | None] = relationship("Servicio", back_populates="vulnerabilidades", lazy="noload")
    aplicacion_movil: Mapped[AplicacionMovil | None] = relationship(
        "AplicacionMovil", back_populates="vulnerabilidades", lazy="noload"
    )
    historial: Mapped[list[HistorialVulnerabilidad]] = relationship(
        "HistorialVulnerabilidad",
        back_populates="vulnerabilidad",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    excepciones: Mapped[list[ExcepcionVulnerabilidad]] = relationship(
        "ExcepcionVulnerabilidad",
        back_populates="vulnerabilidad",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    aceptaciones_riesgo: Mapped[list[AceptacionRiesgo]] = relationship(
        "AceptacionRiesgo",
        back_populates="vulnerabilidad",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    evidencias_remediacion: Mapped[list[EvidenciaRemediacion]] = relationship(
        "EvidenciaRemediacion",
        back_populates="vulnerabilidad",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    hallazgos_pipeline: Mapped[list[HallazgoPipeline]] = relationship(
        "HallazgoPipeline", back_populates="vulnerabilidad", lazy="noload"
    )
    hallazgos_tercero: Mapped[list[HallazgoTercero]] = relationship(
        "HallazgoTercero", back_populates="vulnerabilidad", lazy="noload"
    )
    hallazgos_sast: Mapped[list[HallazgoSast]] = relationship(
        "HallazgoSast", back_populates="vulnerabilidad", lazy="noload"
    )
    hallazgos_dast: Mapped[list[HallazgoDast]] = relationship(
        "HallazgoDast", back_populates="vulnerabilidad", lazy="noload"
    )
