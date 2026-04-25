"""PipelineRelease schemas — Pydantic v2."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

TIPOS_VALIDOS = ["SAST", "DAST", "SCA"]

RESULTADOS_VALIDOS = [
    "Pendiente",
    "En Progreso",
    "Exitoso",
    "Fallido",
    "Cancelado",
]


class PipelineReleaseBase(BaseModel):
    service_release_id: UUID | None = None
    repositorio_id: UUID | None = None
    rama: str
    scan_id: str | None = None
    mes: int | None = None
    activo_web_id: UUID | None = None
    commit_sha: str | None = None
    tipo: str
    resultado: str = "Pendiente"
    herramienta: str | None = None
    liberado_con_vulns_criticas_o_altas: bool | None = None

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: str) -> str:
        if v not in TIPOS_VALIDOS:
            raise ValueError(f"tipo '{v}' inválido. Valores permitidos: {TIPOS_VALIDOS}")
        return v

    @field_validator("resultado")
    @classmethod
    def validate_resultado(cls, v: str) -> str:
        if v not in RESULTADOS_VALIDOS:
            raise ValueError(f"resultado '{v}' inválido. Valores permitidos: {RESULTADOS_VALIDOS}")
        return v

    @model_validator(mode="after")
    def repo_o_activo(self) -> PipelineReleaseBase:
        if self.tipo == "DAST" and not self.repositorio_id and not self.activo_web_id:
            raise ValueError("DAST: indique repositorio_id y/o activo_web_id (BRD §10.2).")
        if self.tipo in ("SAST", "SCA") and not self.repositorio_id:
            raise ValueError("SAST/SCA: repositorio_id es obligatorio.")
        return self


class PipelineReleaseCreate(PipelineReleaseBase):
    """Fields required to create a pipeline_release. user_id is set from auth context."""

    pass


class PipelineReleaseUpdate(BaseModel):
    """All fields optional for partial updates."""

    repositorio_id: UUID | None = None
    rama: str | None = None
    scan_id: str | None = None
    mes: int | None = None
    activo_web_id: UUID | None = None
    commit_sha: str | None = None
    resultado: str | None = None
    herramienta: str | None = None
    liberado_con_vulns_criticas_o_altas: bool | None = None

    @field_validator("resultado")
    @classmethod
    def validate_resultado(cls, v: str | None) -> str | None:
        if v is not None and v not in RESULTADOS_VALIDOS:
            raise ValueError(f"resultado '{v}' inválido. Valores permitidos: {RESULTADOS_VALIDOS}")
        return v


class PipelineReleaseRead(PipelineReleaseBase):
    """Full pipeline_release representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
