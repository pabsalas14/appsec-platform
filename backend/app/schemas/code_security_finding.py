"""Hallazgos SCR."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CodeSecurityFindingCreate(BaseModel):
    """Creación interna / API — pipeline o extensión futura."""

    fingerprint: str
    review_id: UUID
    user_id: UUID
    archivo: str
    linea_inicio: int
    linea_fin: int
    tipo_malicia: str
    severidad: str
    confianza: float
    descripcion: str
    codigo_snippet: str | None = None
    impacto: str | None = None
    explotabilidad: str | None = None
    remediacion_sugerida: str | None = None
    estado: str = "DETECTED"
    asignado_a_id: UUID | None = None


class CodeSecurityFindingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    review_id: UUID
    fingerprint: str
    archivo: str
    linea_inicio: int
    linea_fin: int
    tipo_malicia: str
    severidad: str
    confianza: float
    descripcion: str
    codigo_snippet: str | None
    impacto: str | None
    explotabilidad: str | None
    remediacion_sugerida: str | None
    estado: str
    asignado_a_id: UUID | None
    assignee_email: str | None = None
    assignee_name: str | None = None
    created_at: datetime
    updated_at: datetime


class CodeSecurityFindingUpdate(BaseModel):
    estado: str | None = None
    asignado_a_id: UUID | None = None


class CodeSecurityEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    review_id: UUID
    event_ts: datetime
    commit_hash: str
    autor: str
    archivo: str
    accion: str
    mensaje_commit: str | None
    nivel_riesgo: str
    indicadores: list[str]
    descripcion: str | None
    created_at: datetime


class CodeSecurityReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    review_id: UUID
    resumen_ejecutivo: str
    desglose_severidad: dict
    narrativa_evolucion: str | None
    pasos_remediacion: list
    puntuacion_riesgo_global: int
    created_at: datetime
    updated_at: datetime


class ScrAnalysisMetricRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    review_id: UUID
    user_id: UUID
    agent: str
    provider: str | None
    model: str | None
    started_at: datetime
    completed_at: datetime
    duration_ms: int
    tokens_used: int
    estimated_cost_usd: float
    status: str
    error: str | None
    extra: dict | None
    created_at: datetime


class CodeSecurityFalsePositiveRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    review_id: UUID
    finding_id: UUID
    user_id: UUID
    reason: str | None
    pattern_type: str | None
    created_at: datetime
