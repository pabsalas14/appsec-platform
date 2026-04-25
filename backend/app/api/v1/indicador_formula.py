"""IndicadorFormula CRUD endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.indicador_formula import IndicadorFormula
from app.models.user import User
from app.schemas.indicador_formula import IndicadorFormulaCreate, IndicadorFormulaRead, IndicadorFormulaUpdate
from app.services.indicador_formula_service import indicador_formula_svc

router = APIRouter()


@router.get("")
async def list_indicador_formulas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List indicador formulas owned by the current user."""
    items = await indicador_formula_svc.list(db, filters={"user_id": current_user.id})
    return success([IndicadorFormulaRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_indicador_formula(
    entity: IndicadorFormula = Depends(require_ownership(indicador_formula_svc)),
):
    """Get a single owned indicador formula by ID (404 if not owned)."""
    return success(IndicadorFormulaRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_indicador_formula(
    entity_in: IndicadorFormulaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new indicador formula for the current user."""
    entity = await indicador_formula_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(IndicadorFormulaRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_indicador_formula(
    entity_in: IndicadorFormulaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: IndicadorFormula = Depends(require_ownership(indicador_formula_svc)),
):
    """Partially update an owned indicador formula (404 if not owned)."""
    updated = await indicador_formula_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(IndicadorFormulaRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_indicador_formula(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: IndicadorFormula = Depends(require_ownership(indicador_formula_svc)),
):
    """Delete an owned indicador formula (404 if not owned)."""
    await indicador_formula_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "IndicadorFormula deleted"})
