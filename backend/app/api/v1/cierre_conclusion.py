"""CierreConclusion CRUD endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.cierre_conclusion import CierreConclusion
from app.models.user import User
from app.schemas.cierre_conclusion import CierreConclusionCreate, CierreConclusionRead, CierreConclusionUpdate
from app.services.cierre_conclusion_service import cierre_conclusion_svc

router = APIRouter()


@router.get("")
async def list_cierre_conclusiones(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List cierre conclusiones owned by the current user."""
    items = await cierre_conclusion_svc.list(db, filters={"user_id": current_user.id})
    return success([CierreConclusionRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_cierre_conclusion(
    entity: CierreConclusion = Depends(require_ownership(cierre_conclusion_svc)),
):
    """Get a single owned cierre conclusion by ID (404 if not owned)."""
    return success(CierreConclusionRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_cierre_conclusion(
    entity_in: CierreConclusionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new cierre conclusion for the current user."""
    entity = await cierre_conclusion_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(CierreConclusionRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_cierre_conclusion(
    entity_in: CierreConclusionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: CierreConclusion = Depends(require_ownership(cierre_conclusion_svc)),
):
    """Partially update an owned cierre conclusion (404 if not owned)."""
    updated = await cierre_conclusion_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(CierreConclusionRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_cierre_conclusion(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: CierreConclusion = Depends(require_ownership(cierre_conclusion_svc)),
):
    """Delete an owned cierre conclusion (404 if not owned)."""
    await cierre_conclusion_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "CierreConclusion deleted"})
