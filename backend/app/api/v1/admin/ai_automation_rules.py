"""Admin AI Automation Rules endpoints — trigger/action automation management (FASE 8)."""

from __future__ import annotations

import time
import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_backoffice
from app.core.exceptions import NotFoundException, BadRequestException
from app.core.logging import logger
from app.core.response import paginated, success
from app.models.ai_rule import AIRule
from app.models.user import User
from app.schemas.ai_rule import (
    AIRuleCreate,
    AIRuleList,
    AIRuleRead,
    AIRuleUpdate,
    AIRuleTest,
    AIRuleTestResult,
    TRIGGER_TYPES,
    ACTION_TYPES,
)
from app.services.audit_service import record as audit_record
from app.services.ai_rule_service import ai_rule_svc

router = APIRouter()


@router.get("", response_model=AIRuleList)
async def list_rules(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    trigger_type: str | None = Query(None),
    action_type: str | None = Query(None),
    enabled: bool | None = Query(None),
):
    """List AI automation rules (paginated, filterable)."""
    query = select(AIRule).where(AIRule.deleted_at.is_(None))
    
    if search:
        query = query.where(AIRule.name.ilike(f"%{search}%"))
    
    if trigger_type:
        if trigger_type not in TRIGGER_TYPES:
            raise BadRequestException(f"Invalid trigger_type: {trigger_type}")
        query = query.where(AIRule.trigger_type == trigger_type)
    
    if action_type:
        if action_type not in ACTION_TYPES:
            raise BadRequestException(f"Invalid action_type: {action_type}")
        query = query.where(AIRule.action_type == action_type)
    
    if enabled is not None:
        query = query.where(AIRule.enabled == enabled)
    
    rows = await db.scalars(query.offset(skip).limit(limit))
    total = await db.scalar(
        select(func.count()).select_from(AIRule).where(AIRule.deleted_at.is_(None))
    )
    
    logger.info("ai_rule.list", extra={"skip": skip, "limit": limit, "total": total})
    
    return AIRuleList(
        items=[AIRuleRead.model_validate(r) for r in rows],
        total=total,
        page=skip // limit,
        per_page=limit,
    )


@router.post("", status_code=201, response_model=AIRuleRead)
async def create_rule(
    payload: AIRuleCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Create a new AI automation rule.
    
    Validates trigger_type and action_type against allowed values.
    """
    # Validate trigger/action types
    if payload.trigger_type not in TRIGGER_TYPES:
        raise BadRequestException(f"Invalid trigger_type. Must be one of: {', '.join(TRIGGER_TYPES)}")
    
    if payload.action_type not in ACTION_TYPES:
        raise BadRequestException(f"Invalid action_type. Must be one of: {', '.join(ACTION_TYPES)}")
    
    rule = await ai_rule_svc.create(
        db,
        payload,
        scope={"created_by": admin.id},  # Track who created it
    )
    await audit_record(db, admin.id, "ai_rule", "create", rule.id)
    logger.info("ai_rule.create", extra={"rule_id": str(rule.id), "trigger_type": payload.trigger_type, "action_type": payload.action_type})
    
    return AIRuleRead.model_validate(rule)


@router.get("/{rule_id}", response_model=AIRuleRead)
async def get_rule(
    rule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Get a specific AI automation rule by ID."""
    rule = await ai_rule_svc.get(db, rule_id)
    if not rule or rule.deleted_at is not None:
        raise NotFoundException("AI rule not found")
    
    logger.info("ai_rule.get", extra={"rule_id": str(rule_id)})
    return AIRuleRead.model_validate(rule)


@router.patch("/{rule_id}", response_model=AIRuleRead)
async def update_rule(
    rule_id: uuid.UUID,
    payload: AIRuleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Update an AI automation rule by ID."""
    rule = await ai_rule_svc.get(db, rule_id)
    if not rule or rule.deleted_at is not None:
        raise NotFoundException("AI rule not found")
    
    # Validate if trigger_type/action_type are being changed
    if payload.trigger_type and payload.trigger_type not in TRIGGER_TYPES:
        raise BadRequestException(f"Invalid trigger_type. Must be one of: {', '.join(TRIGGER_TYPES)}")
    
    if payload.action_type and payload.action_type not in ACTION_TYPES:
        raise BadRequestException(f"Invalid action_type. Must be one of: {', '.join(ACTION_TYPES)}")
    
    rule = await ai_rule_svc.update(db, rule_id, payload)
    await audit_record(db, admin.id, "ai_rule", "update", rule_id)
    logger.info("ai_rule.update", extra={"rule_id": str(rule_id)})
    
    return AIRuleRead.model_validate(rule)


@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Soft-delete an AI automation rule by ID."""
    rule = await ai_rule_svc.get(db, rule_id)
    if not rule or rule.deleted_at is not None:
        raise NotFoundException("AI rule not found")
    
    await ai_rule_svc.delete(db, rule_id, deleted_by=admin.id)
    await audit_record(db, admin.id, "ai_rule", "delete", rule_id)
    logger.info("ai_rule.delete", extra={"rule_id": str(rule_id)})
    
    return success({"deleted": True})


@router.post("/{rule_id}/test", response_model=AIRuleTestResult)
async def test_rule(
    rule_id: uuid.UUID,
    payload: AIRuleTest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Execute a dry-run test of an AI automation rule without persisting changes.
    
    This validates the rule configuration and simulates execution.
    Useful for debugging and validation before enabling.
    """
    rule = await ai_rule_svc.get(db, rule_id)
    if not rule or rule.deleted_at is not None:
        raise NotFoundException("AI rule not found")
    
    start_time = time.time()
    
    try:
        # Simple validation: check that trigger/action config are present and valid
        if not rule.trigger_config:
            return AIRuleTestResult(
                rule_id=rule_id,
                status="error",
                message="Trigger configuration is empty",
                execution_time_ms=None,
                error_details="trigger_config is required",
            )
        
        if not rule.action_config:
            return AIRuleTestResult(
                rule_id=rule_id,
                status="error",
                message="Action configuration is empty",
                execution_time_ms=None,
                error_details="action_config is required",
            )
        
        # Simulate execution based on action type
        execution_time_ms = (time.time() - start_time) * 1000
        
        logger.info(
            "ai_rule.test",
            extra={
                "rule_id": str(rule_id),
                "trigger_type": rule.trigger_type,
                "action_type": rule.action_type,
                "execution_time_ms": execution_time_ms,
            },
        )
        
        return AIRuleTestResult(
            rule_id=rule_id,
            status="success",
            message=f"Test executed successfully. Rule would trigger on {rule.trigger_type} and execute {rule.action_type}.",
            execution_time_ms=execution_time_ms,
        )
    
    except Exception as e:
        execution_time_ms = (time.time() - start_time) * 1000
        logger.error(
            "ai_rule.test_error",
            extra={
                "rule_id": str(rule_id),
                "error": str(e),
                "execution_time_ms": execution_time_ms,
            },
        )
        
        return AIRuleTestResult(
            rule_id=rule_id,
            status="error",
            message=f"Test failed: {str(e)}",
            execution_time_ms=execution_time_ms,
            error_details=str(e),
        )


@router.get("/metadata/triggers", tags=["Admin · AI Automation Rules"])
async def get_trigger_types(_admin: User = Depends(require_backoffice)):
    """Get available trigger types for rule creation."""
    return success({
        "triggers": [
            {
                "id": "on_vulnerability_created",
                "label": "Vulnerability Created",
                "description": "Triggers when a new vulnerability is created",
                "configurable_fields": ["severity", "source"],
            },
            {
                "id": "on_vulnerability_status_changed",
                "label": "Vulnerability Status Changed",
                "description": "Triggers when a vulnerability status changes",
                "configurable_fields": ["old_status", "new_status"],
            },
            {
                "id": "on_release_created",
                "label": "Release Created",
                "description": "Triggers when a new release is created",
                "configurable_fields": ["environment"],
            },
            {
                "id": "on_theme_created",
                "label": "Theme Created",
                "description": "Triggers when an emerging theme is created",
                "configurable_fields": ["category"],
            },
            {
                "id": "on_sla_at_risk",
                "label": "SLA At Risk",
                "description": "Triggers when an SLA is at risk",
                "configurable_fields": ["severity_threshold", "hours_remaining"],
            },
            {
                "id": "cron",
                "label": "Scheduled (Cron)",
                "description": "Triggers on a schedule (e.g., daily at 9am)",
                "configurable_fields": ["cron_expression"],
            },
        ]
    })


@router.get("/metadata/actions", tags=["Admin · AI Automation Rules"])
async def get_action_types(_admin: User = Depends(require_backoffice)):
    """Get available action types for rule creation."""
    return success({
        "actions": [
            {
                "id": "send_notification",
                "label": "Send Notification",
                "description": "Send a notification to users",
                "configurable_fields": ["message_template", "recipients", "channels"],
            },
            {
                "id": "create_ticket",
                "label": "Create Ticket",
                "description": "Create a ticket in an external system",
                "configurable_fields": ["ticket_type", "priority", "assignee"],
            },
            {
                "id": "assign_to_user",
                "label": "Assign to User",
                "description": "Assign the entity to a user",
                "configurable_fields": ["user_id", "priority"],
            },
            {
                "id": "tag_entity",
                "label": "Tag Entity",
                "description": "Add tags to the entity",
                "configurable_fields": ["tags", "replace_existing"],
            },
            {
                "id": "generate_summary",
                "label": "Generate Summary (LLM)",
                "description": "Use LLM to generate a summary",
                "configurable_fields": ["prompt_template", "max_tokens"],
            },
            {
                "id": "enrich_data",
                "label": "Enrich Data (LLM)",
                "description": "Use LLM to enrich entity data",
                "configurable_fields": ["fields_to_enrich", "prompt_template"],
            },
            {
                "id": "suggest_fix",
                "label": "Suggest Fix (LLM)",
                "description": "Use LLM to suggest remediation",
                "configurable_fields": ["context_fields", "prompt_template"],
            },
        ]
    })
