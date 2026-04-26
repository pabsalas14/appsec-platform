"""AI Rule schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AIRuleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    entity_type: str = Field(..., min_length=1, max_length=100)
    trigger_condition: str = Field(..., min_length=1)
    action: str = Field(..., min_length=1)
    model_id: str | None = Field(None, max_length=100)
    is_active: bool = True
    max_retries: int = 3
    timeout_seconds: int = 30


class AIRuleCreate(AIRuleBase):
    pass


class AIRuleUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    trigger_condition: str | None = None
    action: str | None = None
    model_id: str | None = None
    is_active: bool | None = None
    max_retries: int | None = None
    timeout_seconds: int | None = None


class AIRuleRead(AIRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class AIRuleList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    items: list[AIRuleRead]
    total: int
    page: int
    per_page: int


class AIRuleTest(BaseModel):
    data: dict = Field(..., description="Sample data for dry-run")


class AIRuleExecute(BaseModel):
    data: dict = Field(..., description="Data to execute rule against")
