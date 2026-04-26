"""Admin Formula endpoints — reusable formula management."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import BadRequestException, NotFoundException
from app.core.formula_engine import FormulaEngine, FormulaError
from app.core.logging import logger
from app.core.response import paginated, success
from app.models.formula import Formula
from app.models.user import User
from app.schemas.formula import (
    FormulaCreate,
    FormulaList,
    FormulaRead,
    FormulaTest,
    FormulaTestResult,
    FormulaUpdate,
    FunctionInfo,
)
from app.services.audit_service import record as audit_record
from app.services.formula_service import formula_svc

router = APIRouter()


@router.get("", response_model=FormulaList)
async def list_formulas(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List all formulas (paginated)."""
    rows = await formula_svc.list(db, skip=skip, limit=limit)
    total = await db.scalar(select(func.count()).select_from(Formula))
    logger.info("formula.list", extra={"skip": skip, "limit": limit, "total": total})
    return paginated(
        [FormulaRead.model_validate(r).model_dump(mode="json") for r in rows],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("", status_code=201)
async def create_formula(
    payload: FormulaCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Create a new formula."""
    # Validate syntax before saving
    validation = FormulaEngine.validate_syntax(payload.formula_text)
    if not validation["valid"]:
        raise BadRequestException(f"Invalid formula syntax: {', '.join(validation['errors'])}")

    formula = await formula_svc.create(db, payload)
    await audit_record(
        db,
        action="formula.create",
        entity_type="formulas",
        entity_id=str(formula.id),
        metadata={
            "nombre": formula.nombre,
            "motor": formula.motor,
            "enabled": formula.enabled,
            "functions": validation.get("functions_used", []),
        },
    )
    logger.info("formula.create", extra={"formula_id": str(formula.id), "nombre": formula.nombre})
    return success(FormulaRead.model_validate(formula).model_dump(mode="json"), status_code=201)


@router.get("/{formula_id}")
async def get_formula(
    formula_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Retrieve a single formula."""
    formula = await formula_svc.get(db, formula_id)
    if not formula:
        raise NotFoundException("Formula not found")
    return success(FormulaRead.model_validate(formula).model_dump(mode="json"))


@router.patch("/{formula_id}")
async def update_formula(
    formula_id: uuid.UUID,
    payload: FormulaUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Update a formula."""
    formula = await formula_svc.get(db, formula_id)
    if not formula:
        raise NotFoundException("Formula not found")

    # If updating formula_text, validate syntax
    if payload.formula_text:
        validation = FormulaEngine.validate_syntax(payload.formula_text)
        if not validation["valid"]:
            raise BadRequestException(f"Invalid formula syntax: {', '.join(validation['errors'])}")

    old_values = {
        "nombre": formula.nombre,
        "enabled": formula.enabled,
    }

    formula = await formula_svc.update(db, formula_id, payload)
    await audit_record(
        db,
        action="formula.update",
        entity_type="formulas",
        entity_id=str(formula_id),
        metadata={
            "changes": {
                "nombre": {"old": old_values["nombre"], "new": formula.nombre},
                "enabled": {"old": old_values["enabled"], "new": formula.enabled},
            }
        },
    )
    logger.info("formula.update", extra={"formula_id": str(formula_id)})
    return success(FormulaRead.model_validate(formula).model_dump(mode="json"))


@router.delete("/{formula_id}", status_code=204)
async def delete_formula(
    formula_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Delete a formula (soft delete via SoftDeleteMixin)."""
    formula = await formula_svc.get(db, formula_id)
    if not formula:
        raise NotFoundException("Formula not found")

    await formula_svc.delete(db, formula_id)
    await audit_record(
        db,
        action="formula.delete",
        entity_type="formulas",
        entity_id=str(formula_id),
        metadata={
            "nombre": formula.nombre,
            "motor": formula.motor,
        },
    )
    logger.info("formula.delete", extra={"formula_id": str(formula_id)})
    return None


@router.post("/test", response_model=FormulaTestResult)
async def test_formula(
    payload: FormulaTest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Test formula execution with sample data."""
    try:
        result = FormulaEngine.execute(payload.formula_text, payload.data)
        logger.info("formula.test", extra={"success": True, "formula_len": len(payload.formula_text)})
        return success(FormulaTestResult(success=True, result=result).model_dump(mode="json"))
    except FormulaError as e:
        logger.warning("formula.test", extra={"error": str(e), "formula_len": len(payload.formula_text)})
        return success(FormulaTestResult(success=False, error=str(e)).model_dump(mode="json"))
    except Exception as e:
        logger.error("formula.test", extra={"error": str(e)})
        return success(FormulaTestResult(success=False, error="Unexpected error during execution").model_dump(mode="json"))


@router.get("/functions/supported")
async def get_supported_functions(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """List all supported formula functions."""
    functions = FormulaEngine.get_supported_functions()
    logger.info("formula.functions.list", extra={"count": len(functions)})
    return success(functions)
