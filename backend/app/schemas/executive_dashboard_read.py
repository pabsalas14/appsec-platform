"""Esquemas Pydantic para `GET /dashboard/executive` (documentación y contrato).

El endpoint devuelve el sobre estándar `{ "status", "data" }` (ver `app.core.response.success`).
`ExecutiveDashboardData` describe el cuerpo de `data` tal como lo construye `dashboard_executive`.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class SlaStatusItemRead(BaseModel):
    model_config = ConfigDict(extra="allow")

    status: Literal["ok", "warning", "critical"]
    label: str
    count: int
    percentage: int


class SlaSparkRead(BaseModel):
    a_tiempo_pct: list[int] = Field(default_factory=list)
    en_riesgo_pct: list[int] = Field(default_factory=list)
    vencido_pct: list[int] = Field(default_factory=list)


class ExecutiveDashboardData(BaseModel):
    """Cuerpo `data` de la respuesta exitosa de `/api/v1/dashboard/executive`."""

    model_config = ConfigDict(extra="allow")

    kpis: dict[str, Any]
    kpi_sub: dict[str, Any] | None = None
    kpi_trends: dict[str, Any] | None = None
    risk_level: str
    security_posture: int
    trend_months: int
    trend_mode: Literal["sliding", "calendar"] = "sliding"
    ref_month: str | None = None
    trend_data: list[dict[str, Any]]
    sla_spark: SlaSparkRead | None = None
    top_repos: list[dict[str, Any]]
    sla_status: list[SlaStatusItemRead]
    audits: list[dict[str, Any]]
    audits_total: int = 0
    audits_offset: int = 0
    audits_limit: int = 10
    audits_solo_activas: bool = False
    generated_at: str | None = None
    applied_filters: dict[str, Any] | None = None


class ApiSuccessEnvelope(BaseModel):
    status: Literal["success"] = "success"
    data: ExecutiveDashboardData
