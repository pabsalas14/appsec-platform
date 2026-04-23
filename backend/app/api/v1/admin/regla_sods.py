"""ReglaSoD admin endpoints — Segregación de Funciones configurable (A6).

Solo super_admin puede crear, modificar o eliminar reglas SoD.
Todo cambio genera audit log automáticamente via BaseService.
"""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps import require_role
from app.core.exceptions import NotFoundException
from app.core.response import success
from app.models.user import User
from app.schemas.regla_so_d import ReglaSoDCreate, ReglaSoDRead, ReglaSoDUpdate
from app.services.regla_so_d_service import regla_so_d_svc

router = APIRouter()


@router.get("")
async def list_regla_sods(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    """List all SoD rules. Admin only."""
    items = await regla_so_d_svc.list(db)
    return success([ReglaSoDRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_regla_sod(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    """Get a SoD rule by ID. Admin only."""
    item = await regla_so_d_svc.get(db, id)
    if not item:
        raise NotFoundException("ReglaSoD")
    return success(ReglaSoDRead.model_validate(item).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_regla_sod(
    entity_in: ReglaSoDCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Create a new SoD rule. Admin only. Audit logged."""
    entity = await regla_so_d_svc.create(
        db, entity_in, extra={"user_id": current_user.id}
    )
    return success(ReglaSoDRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_regla_sod(
    id: UUID,
    entity_in: ReglaSoDUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    """Partially update a SoD rule. Admin only. Audit logged."""
    existing = await regla_so_d_svc.get(db, id)
    if not existing:
        raise NotFoundException("ReglaSoD")
    updated = await regla_so_d_svc.update(db, id, entity_in)
    return success(ReglaSoDRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_regla_sod(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Soft-delete a SoD rule. Admin only. Audit logged."""
    existing = await regla_so_d_svc.get(db, id)
    if not existing:
        raise NotFoundException("ReglaSoD")
    await regla_so_d_svc.delete(db, id, actor_id=current_user.id)
    return success(None, meta={"message": "ReglaSoD deleted"})
