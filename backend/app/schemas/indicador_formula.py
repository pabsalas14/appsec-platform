"""IndicadorFormula schema — indicator and metric formulas."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class IndicadorFormulaBase(BaseModel):
    """Base schema for IndicadorFormula."""

    code: str = Field(..., min_length=1, max_length=50)
    nombre: str = Field(..., min_length=1, max_length=255)
    motor: str = Field(..., min_length=1, max_length=100)
    formula: dict[str, Any] = Field(...)
    sla_config: dict[str, int] | None = Field(None)
    threshold_green: float | None = None
    threshold_yellow: float | None = None
    threshold_red: float | None = None
    periodicidad: str = Field(..., min_length=1, max_length=50)


class IndicadorFormulaCreate(IndicadorFormulaBase):
    """Schema for creating IndicadorFormula."""

    pass


class IndicadorFormulaUpdate(BaseModel):
    """Schema for updating IndicadorFormula (all fields optional)."""

    code: str | None = Field(None, min_length=1, max_length=50)
    nombre: str | None = Field(None, min_length=1, max_length=255)
    motor: str | None = Field(None, min_length=1, max_length=100)
    formula: dict[str, Any] | None = None
    sla_config: dict[str, int] | None = None
    threshold_green: float | None = None
    threshold_yellow: float | None = None
    threshold_red: float | None = None
    periodicidad: str | None = Field(None, min_length=1, max_length=50)


class IndicadorFormulaRead(IndicadorFormulaBase):
    """Schema for reading IndicadorFormula."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
