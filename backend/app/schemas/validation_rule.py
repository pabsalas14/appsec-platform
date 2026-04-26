"""Validation Rule schemas."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ValidationRuleBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=255, description="Rule name")
    entity_type: str = Field(..., min_length=1, max_length=100, description="Entity type (e.g., vulnerability, release)")
    rule_type: str = Field(..., min_length=1, max_length=50, description="Rule type: required, regex, conditional, formula")
    condition: dict[str, Any] = Field(..., description="Condition JSON structure")
    error_message: str = Field(..., min_length=1, max_length=500, description="Error message")
    enabled: bool = True


class ValidationRuleCreate(ValidationRuleBase):
    pass


class ValidationRuleUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=255)
    rule_type: str | None = Field(None, min_length=1, max_length=50)
    condition: dict[str, Any] | None = None
    error_message: str | None = Field(None, min_length=1, max_length=500)
    enabled: bool | None = None


class ValidationRuleRead(ValidationRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class ValidationRuleList(BaseModel):
    """Paginated list response."""
    items: list[ValidationRuleRead] = Field(default_factory=list)
    total: int
    skip: int
    limit: int


class ValidationRuleTest(BaseModel):
    data: dict = Field(..., description="Sample data to test rule against")


class FormulaValidate(BaseModel):
    formula_text: str = Field(..., min_length=1, description="Formula syntax to validate")


class FormulaExecute(BaseModel):
    formula_text: str = Field(..., min_length=1, description="Formula to execute")
    data: dict = Field(default_factory=dict, description="Data context for formula execution")
