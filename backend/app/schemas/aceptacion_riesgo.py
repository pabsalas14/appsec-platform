"""AceptacionRiesgo schemas — Pydantic v2.

Reglas de negocio:
  - justificacion_negocio obligatoria y no vacía (A1)
  - estado: Pendiente | Aprobada | Rechazada | Vencida | Revocada
  - aprobador_id != user_id cuando ReglaSoD "vulnerabilidad.aceptar_riesgo" activa (A6)
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

ESTADOS_VALIDOS = {"Pendiente", "Aprobada", "Rechazada", "Vencida", "Revocada"}


class AceptacionRiesgoBase(BaseModel):
    vulnerabilidad_id: UUID
    # A1: justificacion_negocio no vacía obligatoria
    justificacion_negocio: str = Field(..., min_length=10)
    propietario_riesgo_id: UUID
    fecha_revision_obligatoria: datetime
    estado: str = "Pendiente"
    aprobador_id: UUID | None = None
    fecha_aprobacion: datetime | None = None
    notas_aprobador: str | None = None

    @field_validator("estado")
    @classmethod
    def estado_valido(cls, v: str) -> str:
        if v not in ESTADOS_VALIDOS:
            raise ValueError(f"estado debe ser uno de: {', '.join(sorted(ESTADOS_VALIDOS))}")
        return v


class AceptacionRiesgoCreate(AceptacionRiesgoBase):
    """Campos para registrar aceptación de riesgo. user_id se toma del contexto de auth.

    El servicio valida SoD: aprobador_id != user_id cuando la regla está activa.
    """
    pass


class AceptacionRiesgoUpdate(BaseModel):
    """Todos los campos opcionales para actualizaciones parciales."""
    justificacion_negocio: str | None = Field(None, min_length=10)
    propietario_riesgo_id: UUID | None = None
    fecha_revision_obligatoria: datetime | None = None
    estado: str | None = None
    aprobador_id: UUID | None = None
    fecha_aprobacion: datetime | None = None
    notas_aprobador: str | None = None

    @field_validator("estado")
    @classmethod
    def estado_valido(cls, v: str | None) -> str | None:
        if v is not None and v not in ESTADOS_VALIDOS:
            raise ValueError(f"estado debe ser uno de: {', '.join(sorted(ESTADOS_VALIDOS))}")
        return v


class AceptacionRiesgoRead(AceptacionRiesgoBase):
    """Representación completa retornada por la API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
