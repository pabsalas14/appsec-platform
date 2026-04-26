"""AI Rule schemas — Pydantic models for FASE 8."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# Trigger types enum
TRIGGER_TYPES = [
    "on_vulnerability_created",
    "on_vulnerability_status_changed",
    "on_release_created",
    "on_theme_created",
    "on_sla_at_risk",
    "cron",
]

# Action types enum
ACTION_TYPES = [
    "send_notification",
    "create_ticket",
    "assign_to_user",
    "tag_entity",
    "generate_summary",
    "enrich_data",
    "suggest_fix",
]


class AIRuleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Rule name")
    description: str | None = Field(None, description="Optional description")
    trigger_type: str = Field(..., description=f"One of: {', '.join(TRIGGER_TYPES)}")
    trigger_config: dict[str, Any] = Field(default_factory=dict, description="Trigger-specific configuration")
    action_type: str = Field(..., description=f"One of: {', '.join(ACTION_TYPES)}")
    action_config: dict[str, Any] = Field(default_factory=dict, description="Action-specific configuration")
    enabled: bool = Field(True, description="Enable/disable rule")
    max_retries: int = Field(3, ge=0, le=10, description="Max retry attempts")
    timeout_seconds: int = Field(30, ge=5, le=300, description="Timeout in seconds")


class AIRuleCreate(AIRuleBase):
    pass


class AIRuleUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    trigger_type: str | None = None
    trigger_config: dict[str, Any] | None = None
    action_type: str | None = None
    action_config: dict[str, Any] | None = None
    enabled: bool | None = None
    max_retries: int | None = Field(None, ge=0, le=10)
    timeout_seconds: int | None = Field(None, ge=5, le=300)


class AIRuleRead(AIRuleBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_by: UUID | None = None
    created_at: datetime
    updated_at: datetime


class AIRuleList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    items: list[AIRuleRead]
    total: int
    page: int
    per_page: int


class AIRuleTest(BaseModel):
    """Payload for testing a rule (dry-run)."""
    data: dict[str, Any] = Field(..., description="Sample data for dry-run")


class AIRuleExecute(BaseModel):
    """Payload for executing a rule."""
    data: dict[str, Any] = Field(..., description="Data to execute rule against")


class AIRuleTestResult(BaseModel):
    """Result of a rule test/dry-run."""
    rule_id: UUID
    status: str = Field(..., description="success, error")
    message: str
    dry_run: bool = True
    execution_time_ms: float | None = None
    error_details: str | None = None
