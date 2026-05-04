"""Schemas — captura manual de indicadores (tipo 2)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class IndicadorManualUpsert(BaseModel):
    valor: float = Field(..., description="Valor numérico del periodo")
    notas: str | None = Field(None, max_length=4000)


class IndicadorManualOut(BaseModel):
    code: str
    periodo: str
    valor: float
    notas: str | None

    model_config = {"from_attributes": True}
