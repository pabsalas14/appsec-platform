"""Admin Validation Rule endpoints — entity-level validation rule management."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import BadRequestException, NotFoundException
from app.core.logging import logger
from app.core.response import paginated, success
from app.models.user import User
from app.models.validation_rule import ValidationRule
from app.schemas.validation_rule import (
    ValidationRuleCreate,
    ValidationRuleRead,
    ValidationRuleTest,
    ValidationRuleUpdate,
)
from app.services.audit_service import record as audit_record
from app.services.validation_rule_service import validate_rule, validation_rule_svc

router = APIRouter()


@router.get("")
async def list_rules(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List all validation rules (paginated)."""
    stmt = (
        select(ValidationRule)
        .where(ValidationRule.deleted_at.is_(None))
        .order_by(ValidationRule.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()
    total = await db.scalar(select(func.count()).select_from(ValidationRule).where(ValidationRule.deleted_at.is_(None)))
    total_i = int(total or 0)
    page = (skip // limit) + 1
    logger.info("validation_rule.list", extra={"skip": skip, "limit": limit, "total": total_i})
    return paginated(
        [ValidationRuleRead.model_validate(r).model_dump(mode="json") for r in rows],
        page=page,
        page_size=limit,
        total=total_i,
    )


@router.post("", status_code=201)
async def create_rule(
    payload: ValidationRuleCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Create a new validation rule."""
    rule = await validation_rule_svc.create(db, payload, extra={"created_by": admin.id})
    await audit_record(
        db,
        action="validation_rule.create",
        entity_type="validation_rules",
        entity_id=str(rule.id),
        metadata={
            "entity_type": rule.entity_type,
            "rule_type": rule.rule_type,
            "enabled": rule.enabled,
        },
    )
    logger.info("validation_rule.create", extra={"rule_id": str(rule.id), "entity_type": rule.entity_type})
    return success(ValidationRuleRead.model_validate(rule).model_dump(mode="json"))


@router.get("/{rule_id}")
async def get_rule(
    rule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Retrieve a single validation rule."""
    rule = await validation_rule_svc.get(db, rule_id)
    if not rule:
        raise NotFoundException("Rule not found")
    return success(ValidationRuleRead.model_validate(rule).model_dump(mode="json"))


@router.patch("/{rule_id}")
async def update_rule(
    rule_id: uuid.UUID,
    payload: ValidationRuleUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Update a validation rule."""
    rule = await validation_rule_svc.get(db, rule_id)
    if not rule:
        raise NotFoundException("Rule not found")

    old_values = {
        "nombre": rule.nombre,
        "enabled": rule.enabled,
        "rule_type": rule.rule_type,
    }

    rule = await validation_rule_svc.update(db, rule_id, payload)
    await audit_record(
        db,
        action="validation_rule.update",
        entity_type="validation_rules",
        entity_id=str(rule_id),
        metadata={
            "changes": {
                "nombre": {"old": old_values["nombre"], "new": rule.nombre},
                "enabled": {"old": old_values["enabled"], "new": rule.enabled},
                "rule_type": {"old": old_values["rule_type"], "new": rule.rule_type},
            }
        },
    )
    logger.info("validation_rule.update", extra={"rule_id": str(rule_id)})
    return success(ValidationRuleRead.model_validate(rule).model_dump(mode="json"))


@router.delete("/{rule_id}", status_code=204)
async def delete_rule(
    rule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Delete a validation rule (soft delete)."""
    rule = await validation_rule_svc.get(db, rule_id)
    if not rule:
        raise NotFoundException("Rule not found")

    await validation_rule_svc.delete(db, rule_id)
    await audit_record(
        db,
        action="validation_rule.delete",
        entity_type="validation_rules",
        entity_id=str(rule_id),
        metadata={
            "entity_type": rule.entity_type,
            "rule_type": rule.rule_type,
        },
    )
    logger.info("validation_rule.delete", extra={"rule_id": str(rule_id)})
    return None


@router.post("/{rule_id}/test")
async def test_rule(
    rule_id: uuid.UUID,
    payload: ValidationRuleTest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Test validation rule with sample data."""
    rule = await validation_rule_svc.get(db, rule_id)
    if not rule:
        raise NotFoundException("Rule not found")

    try:
        is_valid = await validate_rule(rule, payload.data)
        logger.info("validation_rule.test", extra={"rule_id": str(rule_id), "valid": is_valid})
        return success(
            {
                "rule_id": str(rule_id),
                "valid": is_valid,
                "rule_type": rule.rule_type,
                "message": None if is_valid else rule.error_message,
            }
        )
    except BadRequestException as e:
        logger.warning("validation_rule.test", extra={"rule_id": str(rule_id), "error": str(e)})
        return success(
            {
                "rule_id": str(rule_id),
                "valid": False,
                "rule_type": rule.rule_type,
                "message": str(e),
            }
        )
    except Exception as e:
        logger.error("validation_rule.test", extra={"rule_id": str(rule_id), "error": str(e)})
        raise BadRequestException(f"Error testing rule: {e!s}") from e
