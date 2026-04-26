"""Formula schemas for admin endpoints."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FormulaBase(BaseModel):
    """Base schema for Formula."""
    nombre: str = Field(..., min_length=1, max_length=255, description="Formula name")
    description: str | None = Field(None, max_length=1000, description="Formula description")
    formula_text: str = Field(..., min_length=1, description="Formula expression")
    motor: str = Field(default="formula_engine", max_length=100, description="Execution engine")
    enabled: bool = True


class FormulaCreate(FormulaBase):
    """Schema for creating Formula."""
    pass


class FormulaUpdate(BaseModel):
    """Schema for updating Formula."""
    nombre: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    formula_text: str | None = Field(None, min_length=1)
    enabled: bool | None = None


class FormulaRead(FormulaBase):
    """Schema for reading Formula."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class FormulaList(BaseModel):
    """Paginated list response."""
    items: list[FormulaRead] = Field(default_factory=list)
    total: int
    skip: int
    limit: int


class FormulaTest(BaseModel):
    """Test formula execution."""
    formula_text: str = Field(..., min_length=1, description="Formula to test")
    data: dict[str, Any] = Field(default_factory=dict, description="Test data context")


class FormulaTestResult(BaseModel):
    """Result of formula test."""
    success: bool
    result: Any = None
    error: str | None = None


class FunctionInfo(BaseModel):
    """Info about a supported formula function."""
    name: str
    description: str
    syntax: str
