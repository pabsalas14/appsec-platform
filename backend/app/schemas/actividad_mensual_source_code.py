"""ActividadMensualSourceCode schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ActividadMensualSourceCodeBase(BaseModel):
    programa_source_code_id: UUID
    mes: int = Field(..., ge=1, le=12)
    ano: int = Field(..., ge=2000, le=2100)
    total_hallazgos: int | None = Field(None, ge=0)
    criticos: int | None = Field(None, ge=0)
    altos: int | None = Field(None, ge=0)
    medios: int | None = Field(None, ge=0)
    bajos: int | None = Field(None, ge=0)
    sub_estado: str | None = Field(None, max_length=100)
    notas: str | None = None


class ActividadMensualSourceCodeCreate(ActividadMensualSourceCodeBase):
    pass


class ActividadMensualSourceCodeUpdate(BaseModel):
    mes: int | None = Field(None, ge=1, le=12)
    ano: int | None = Field(None, ge=2000, le=2100)
    total_hallazgos: int | None = Field(None, ge=0)
    criticos: int | None = Field(None, ge=0)
    altos: int | None = Field(None, ge=0)
    medios: int | None = Field(None, ge=0)
    bajos: int | None = Field(None, ge=0)
    sub_estado: str | None = Field(None, max_length=100)
    notas: str | None = None


class ActividadMensualSourceCodeRead(ActividadMensualSourceCodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    score: float | None = Field(None, ge=0.0, le=100.0)
    created_at: datetime
    updated_at: datetime
