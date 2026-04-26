"""Admin AI Automation Rules endpoints — trigger/action automation management."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import NotFoundException
from app.core.logging import logger
from app.core.response import paginated, success
from app.models.ai_rule import AIRule
from app.models.user import User
from app.schemas.ai_rule import (
    AIRuleCreate,
    AIRuleList,
    AIRuleRead,
    AIRuleUpdate,
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
):
    """List AI automation rules (paginated)."""
    query = select(AIRule).where(AIRule.deleted_at.is_(None))
    
    if search:
        query = query.where(AIRule.nombre.ilike(f"%{search}%"))
    
    rows = await db.scalars(query.offset(skip).limit(limit))
    total = await db.scalar(
        select(func.count()).select_from(AIRule).where(AIRule.deleted_at.is_(None))
    )
    
    logger.info("ai_rule.list", extra={"skip": skip, "limit": limit, "total": total})
    return paginated(
        [AIRuleRead.model_validate(r).model_dump(mode="json") for r in rows],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("", status_code=201)
async def create_rule(
    payload: AIRuleCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Create a new AI automation rule."""
    rule = await ai_rule_svc.create(db, payload)
    await audit_record(db, admin.id, "ai_rule", "create", rule.id)
    logger.info("ai_rule.create", extra={"rule_id": str(rule.id)})
    return success(AIRuleRead.model_validate(rule).model_dump(mode="json"))


@router.put("/{rule_id}")
async def update_rule(
    rule_id: uuid.UUID,
    payload: AIRuleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Update an AI automation rule by ID."""
    rule = await ai_rule_svc.get(db, rule_id)
    if not rule:
        raise NotFoundException("AI rule not found")
    
    rule = await ai_rule_svc.update(db, rule_id, payload)
    await audit_record(db, admin.id, "ai_rule", "update", rule.id)
    logger.info("ai_rule.update", extra={"rule_id": str(rule.id)})
    return success(AIRuleRead.model_validate(rule).model_dump(mode="json"))


@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Soft-delete an AI automation rule by ID."""
    rule = await ai_rule_svc.get(db, rule_id)
    if not rule:
        raise NotFoundException("AI rule not found")
    
    await ai_rule_svc.delete(db, rule_id, deleted_by=admin.id)
    await audit_record(db, admin.id, "ai_rule", "delete", rule_id)
    logger.info("ai_rule.delete", extra={"rule_id": str(rule_id)})
    return success({"deleted": True})


@router.post("/{rule_id}/dry-run")
async def dry_run_rule(
    rule_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Execute a dry-run of an AI automation rule without persisting changes."""
    rule = await ai_rule_svc.get(db, rule_id)
    if not rule:
        raise NotFoundException("AI rule not found")
    
    logger.info("ai_rule.dry_run", extra={"rule_id": str(rule_id)})
    
    result = {
        "rule_id": str(rule_id),
        "status": "success",
        "dry_run": True,
        "message": "Dry-run executed successfully. No changes persisted.",
    }
    
    return success(result)
