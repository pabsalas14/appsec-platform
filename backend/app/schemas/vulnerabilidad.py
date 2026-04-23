"""Vulnerabilidad schemas — Pydantic v2.

Validaciones de negocio:
  - exactamente uno de repositorio_id / activo_web_id / servicio_id / aplicacion_movil_id
    debe estar presente en Create (validado en el service/router, no aquí para no
    bloquear Updates parciales).
  - fuente: SAST | DAST | SCA | TM | MAST | Auditoria | Tercero
  - severidad: Critica | Alta | Media | Baja
  - estado validado contra config (sla.estatus_vulnerabilidad)
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

FUENTES_VALIDAS = {"SAST", "DAST", "SCA", "TM", "MAST", "Auditoria", "Tercero"}
SEVERIDADES_VALIDAS = {"Critica", "Alta", "Media", "Baja"}


class VulnerabilidadBase(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=255)
    descripcion: Optional[str] = None
    fuente: str
    severidad: str
    estado: str
    cvss_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    cwe_id: Optional[str] = Field(None, max_length=16)
    owasp_categoria: Optional[str] = Field(None, max_length=64)
    responsable_id: Optional[UUID] = None
    fecha_limite_sla: Optional[datetime] = None
    # Polymorphic asset (exactamente uno requerido en Create)
    repositorio_id: Optional[UUID] = None
    activo_web_id: Optional[UUID] = None
    servicio_id: Optional[UUID] = None
    aplicacion_movil_id: Optional[UUID] = None

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
    titulo: Optional[str] = Field(None, min_length=3, max_length=255)
    descripcion: Optional[str] = None
    fuente: Optional[str] = None
    severidad: Optional[str] = None
    estado: Optional[str] = None
    cvss_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    cwe_id: Optional[str] = Field(None, max_length=16)
    owasp_categoria: Optional[str] = Field(None, max_length=64)
    responsable_id: Optional[UUID] = None
    fecha_limite_sla: Optional[datetime] = None
    repositorio_id: Optional[UUID] = None
    activo_web_id: Optional[UUID] = None
    servicio_id: Optional[UUID] = None
    aplicacion_movil_id: Optional[UUID] = None

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
