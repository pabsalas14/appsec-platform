"""TemaEmergente CRUD endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.user import User
from app.models.tema_emergente import TemaEmergente
from app.schemas.tema_emergente import TemaEmergenteCreate, TemaEmergenteRead, TemaEmergenteUpdate
from app.services.tema_emergente_service import tema_emergente_svc

router = APIRouter()


@router.get("")
async def list_temas_emergentes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List temas emergentes owned by the current user."""
    items = await tema_emergente_svc.list(db, filters={"user_id": current_user.id})
    return success([TemaEmergenteRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_tema_emergente(
    entity: TemaEmergente = Depends(require_ownership(tema_emergente_svc)),
):
    """Get a single owned tema emergente by ID (404 if not owned)."""
    return success(TemaEmergenteRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_tema_emergente(
    entity_in: TemaEmergenteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new tema emergente for the current user."""
    entity = await tema_emergente_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(TemaEmergenteRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_tema_emergente(
    entity_in: TemaEmergenteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: TemaEmergente = Depends(require_ownership(tema_emergente_svc)),
):
    """Partially update an owned tema emergente (404 if not owned)."""
    updated = await tema_emergente_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(TemaEmergenteRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_tema_emergente(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: TemaEmergente = Depends(require_ownership(tema_emergente_svc)),
):
    """Delete an owned tema emergente (404 if not owned)."""
    await tema_emergente_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "TemaEmergente deleted"})
