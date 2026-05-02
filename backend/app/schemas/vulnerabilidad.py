"""Vulnerabilidad schemas — Pydantic v2.

Validaciones de negocio:
  - exactamente uno de repositorio_id / activo_web_id / servicio_id / aplicacion_movil_id
    debe estar presente en Create (validado en el service/router, no aquí para no
    bloquear Updates parciales).
  - fuente: SAST | DAST | SCA | CDS | MDA | TM | MAST | Auditoria | Tercero
  - severidad: Critica | Alta | Media | Baja
  - estado validado contra config (sla.estatus_vulnerabilidad)
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

FUENTES_VALIDAS = {"SAST", "DAST", "SCA", "CDS", "MDA", "TM", "MAST", "Auditoria", "Tercero"}
SEVERIDADES_VALIDAS = {"Critica", "Alta", "Media", "Baja"}


class VulnerabilidadBase(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=255)
    descripcion: str | None = None
    fuente: str
    severidad: str
    estado: str
    cvss_score: float | None = Field(None, ge=0.0, le=10.0)
    cwe_id: str | None = Field(None, max_length=16)
    owasp_categoria: str | None = Field(None, max_length=64)
    responsable_id: UUID | None = None
    fecha_limite_sla: datetime | None = None
    # Polymorphic asset (exactamente uno requerido en Create)
    repositorio_id: UUID | None = None
    activo_web_id: UUID | None = None
    servicio_id: UUID | None = None
    aplicacion_movil_id: UUID | None = None
    custom_fields: dict[str, Any] = Field(default_factory=dict, description="P2: campos dinámicos (JSON)")

    @field_validator("fuente")
    @classmethod
    def fuente_valida(cls, v: str) -> str:
        if v not in FUENTES_VALIDAS:
            raise ValueError(f"fuente debe ser uno de: {', '.join(sorted(FUENTES_VALIDAS))}")
        return v

    @field_validator("severidad")
    @classmethod
    def severidad_valida(cls, v: str) -> str:
        if v not in SEVERIDADES_VALIDAS:
            raise ValueError(f"severidad debe ser uno de: {', '.join(sorted(SEVERIDADES_VALIDAS))}")
        return v


class VulnerabilidadCreate(VulnerabilidadBase):
    """Campos requeridos para crear una vulnerabilidad. user_id se toma del contexto de auth.

    Exactamente uno de repositorio_id / activo_web_id / servicio_id / aplicacion_movil_id
    debe estar presente (validado en el router).
    """

    pass


class VulnerabilidadUpdate(BaseModel):
    """Todos los campos opcionales para actualizaciones parciales."""

    titulo: str | None = Field(None, min_length=3, max_length=255)
    descripcion: str | None = None
    fuente: str | None = None
    severidad: str | None = None
    estado: str | None = None
    cvss_score: float | None = Field(None, ge=0.0, le=10.0)
    cwe_id: str | None = Field(None, max_length=16)
    owasp_categoria: str | None = Field(None, max_length=64)
    responsable_id: UUID | None = None
    fecha_limite_sla: datetime | None = None
    repositorio_id: UUID | None = None
    activo_web_id: UUID | None = None
    servicio_id: UUID | None = None
    aplicacion_movil_id: UUID | None = None
    custom_fields: dict[str, Any] | None = None

    @field_validator("fuente")
    @classmethod
    def fuente_valida(cls, v: str | None) -> str | None:
        if v is not None and v not in FUENTES_VALIDAS:
            raise ValueError(f"fuente debe ser uno de: {', '.join(sorted(FUENTES_VALIDAS))}")
        return v

    @field_validator("severidad")
    @classmethod
    def severidad_valida(cls, v: str | None) -> str | None:
        if v is not None and v not in SEVERIDADES_VALIDAS:
            raise ValueError(f"severidad debe ser uno de: {', '.join(sorted(SEVERIDADES_VALIDAS))}")
        return v


class VulnerabilidadRead(VulnerabilidadBase):
    """Representación completa de una vulnerabilidad retornada por la API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    # SLA semáforo calculado dinámicamente (no almacenado, derivado en response)
    # deleted_at no se expone


class VulnerabilidadIATriageRequest(BaseModel):
    """Payload for IA-assisted false-positive triage."""

    contexto_adicional: str | None = Field(default=None, max_length=4000)
    dry_run: bool = True


class VulnerabilidadIATriageRead(BaseModel):
    """Response returned by IA false-positive triage endpoint."""

    provider: str
    model: str
    dry_run: bool
    verdict: Literal["false_positive", "likely_real", "needs_review"]
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str
    suggested_state: str | None = None
    raw_content: str


class VulnerabilidadBulkActionRequest(BaseModel):
    """Acciones masivas sobre hallazgos propios (spec 37)."""

    ids: list[UUID] = Field(..., min_length=1, max_length=100)
    action: Literal["estado", "responsable", "delete"]
    estado: str | None = None
    responsable_id: UUID | None = None

    @model_validator(mode="after")
    def validate_payload(self):
        if self.action == "estado" and (self.estado is None or not str(self.estado).strip()):
            raise ValueError("estado es obligatorio cuando action=estado")
        if self.action == "delete" and (self.estado is not None or self.responsable_id is not None):
            raise ValueError("delete no debe incluir estado ni responsable_id")
        return self


class VulnerabilidadBulkActionResult(BaseModel):
    processed: int
    failed: int
    errors: list[str] = Field(default_factory=list)
