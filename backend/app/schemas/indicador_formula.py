"""IndicadorFormula schema — indicator and metric formulas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional, Any, Dict
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class IndicadorFormulaBase(BaseModel):
    """Base schema for IndicadorFormula."""

    code: str = Field(..., min_length=1, max_length=50)
    nombre: str = Field(..., min_length=1, max_length=255)
    motor: str = Field(..., min_length=1, max_length=100)
    formula: Dict[str, Any] = Field(...)
    sla_config: Optional[Dict[str, int]] = Field(None)
    threshold_green: Optional[float] = None
    threshold_yellow: Optional[float] = None
    threshold_red: Optional[float] = None
    periodicidad: str = Field(..., min_length=1, max_length=50)


class IndicadorFormulaCreate(IndicadorFormulaBase):
    """Schema for creating IndicadorFormula."""

    pass


class IndicadorFormulaUpdate(BaseModel):
    """Schema for updating IndicadorFormula (all fields optional)."""

    code: Optional[str] = Field(None, min_length=1, max_length=50)
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    motor: Optional[str] = Field(None, min_length=1, max_length=100)
    formula: Optional[Dict[str, Any]] = None
    sla_config: Optional[Dict[str, int]] = None
    threshold_green: Optional[float] = None
    threshold_yellow: Optional[float] = None
    threshold_red: Optional[float] = None
    periodicidad: Optional[str] = Field(None, min_length=1, max_length=50)


class IndicadorFormulaRead(IndicadorFormulaBase):
    """Schema for reading IndicadorFormula."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
