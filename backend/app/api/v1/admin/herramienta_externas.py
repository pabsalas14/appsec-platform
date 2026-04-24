"""HerramientaExterna admin endpoints — Gestión Global de Integraciones AppSec (A5, A7).

Solo admin puede crear o modificar las herramientas externas ya que
contienen tokens de alto nivel (como PATs de conectores).
"""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import NotFoundException
from app.core.response import success
from app.models.user import User
from app.schemas.herramienta_externa import (
    HerramientaExternaCreate,
    HerramientaExternaRead,
    HerramientaExternaUpdate,
)
from app.services.herramienta_externa_service import herramienta_externa_svc

router = APIRouter()


@router.get("")
async def list_herramientas(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_backoffice),
):
    """List all configured integrations/tools. Admin only."""
    items = await herramienta_externa_svc.list(db)
    # The read schema applies A7 Data Masking to hide tokens
    return success([HerramientaExternaRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_herramienta(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_backoffice),
):
    """Get a specific tool config by ID. Admin only."""
    item = await herramienta_externa_svc.get(db, id)
    if not item:
        raise NotFoundException("HerramientaExterna")
    return success(HerramientaExternaRead.model_validate(item).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_herramienta(
    entity_in: HerramientaExternaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Create a new integration/tool. Admin only. Audit logged."""
    entity = await herramienta_externa_svc.create(
        db, entity_in, extra={"user_id": current_user.id}
    )
    return success(HerramientaExternaRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_herramienta(
    id: UUID,
    entity_in: HerramientaExternaUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_backoffice),
):
    """Partially update a tool configuration. Admin only. Audit logged."""
    existing = await herramienta_externa_svc.get(db, id)
    if not existing:
        raise NotFoundException("HerramientaExterna")
    
    updated = await herramienta_externa_svc.update(db, id, entity_in)
    return success(HerramientaExternaRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_herramienta(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Soft-delete a tool configuration. Admin only. Audit logged."""
    existing = await herramienta_externa_svc.get(db, id)
    if not existing:
        raise NotFoundException("HerramientaExterna")
        
    await herramienta_externa_svc.delete(db, id, actor_id=current_user.id)
    return success(None, meta={"message": "HerramientaExterna deleted"})
