"""AIAutomationRule schemas — pydantic models for API validation."""

from __future__ import annotations

from typing import Any
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AIAutomationRuleBase(BaseModel):
    """Shared fields."""

    nombre: str = Field(min_length=1, max_length=256)
    trigger_type: str = Field(min_length=1, max_length=128)
    trigger_config: dict[str, Any] = Field(default_factory=dict)
    action_type: str = Field(min_length=1, max_length=128)
    action_config: dict[str, Any] = Field(default_factory=dict)
    enabled: bool = True


class AIAutomationRuleCreate(AIAutomationRuleBase):
    """Payload for POST /ai-automation-rules."""

    pass


class AIAutomationRuleUpdate(BaseModel):
    """Payload for PATCH /ai-automation-rules/{id}."""

    nombre: str | None = None
    trigger_type: str | None = None
    trigger_config: dict[str, Any] | None = None
    action_type: str | None = None
    action_config: dict[str, Any] | None = None
    enabled: bool | None = None


class AIAutomationRuleRead(AIAutomationRuleBase):
    """Response model for GET /ai-automation-rules/{id}."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_by: UUID | None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None


class AIAutomationRuleList(BaseModel):
    """Response model for GET /ai-automation-rules (paginated list)."""

    model_config = ConfigDict(from_attributes=True)

    items: list[AIAutomationRuleRead]
    total: int
    skip: int
    limit: int


__all__ = [
    "AIAutomationRuleCreate",
    "AIAutomationRuleRead",
    "AIAutomationRuleUpdate",
    "AIAutomationRuleList",
]
