"""Validation Rule schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ValidationRuleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    entity_type: str = Field(..., min_length=1, max_length=100)
    rule_type: str = Field(..., min_length=1, max_length=50)
    condition: str = Field(..., min_length=1)
    error_message: str | None = None
    is_active: bool = True


class ValidationRuleCreate(ValidationRuleBase):
    pass


class ValidationRuleUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    rule_type: str | None = Field(None, min_length=1, max_length=50)
    condition: str | None = None
    error_message: str | None = None
    is_active: bool | None = None


class ValidationRuleRead(ValidationRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class ValidationRuleTest(BaseModel):
    data: dict = Field(..., description="Sample data to test rule against")


class FormulaValidate(BaseModel):
    formula: str = Field(..., min_length=1, description="Formula syntax to validate")


class FormulaExecute(BaseModel):
    formula: str = Field(..., min_length=1, description="Formula to execute")
    data: dict = Field(..., description="Data context for formula execution")
