"""OkrSubcompromiso CRUD endpoints with child-weight constraints."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.exceptions import BadRequestException, NotFoundException
from app.core.response import success
from app.models.okr_compromiso import OkrCompromiso
from app.models.okr_subcompromiso import OkrSubcompromiso
from app.models.user import User
from app.schemas.okr_subcompromiso import OkrSubcompromisoCreate, OkrSubcompromisoRead, OkrSubcompromisoUpdate
from app.services.okr_subcompromiso_service import okr_subcompromiso_svc

router = APIRouter()


@router.get("")
async def list_okr_subcompromisos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List okr_subcompromisos owned by the current user."""
    items = await okr_subcompromiso_svc.list(db, filters={"user_id": current_user.id})
    return success([OkrSubcompromisoRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_okr_subcompromiso(
    entity: OkrSubcompromiso = Depends(require_ownership(okr_subcompromiso_svc)),
):
    """Get a single owned okr_subcompromiso by ID (404 if not owned)."""
    return success(OkrSubcompromisoRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_okr_subcompromiso(
    entity_in: OkrSubcompromisoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new okr_subcompromiso for the current user."""
    compromiso = (
        await db.execute(
            select(OkrCompromiso).where(
                OkrCompromiso.id == entity_in.compromiso_id,
                OkrCompromiso.user_id == current_user.id,
                OkrCompromiso.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if compromiso is None:
        raise NotFoundException("Compromiso no encontrado")

    if compromiso.tipo_medicion.strip().lower() == "subitems":
        current_total = (
            await db.execute(
                select(func.coalesce(func.sum(OkrSubcompromiso.peso_interno), 0.0)).where(
                    OkrSubcompromiso.compromiso_id == compromiso.id,
                    OkrSubcompromiso.user_id == current_user.id,
                    OkrSubcompromiso.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        if float(current_total) + entity_in.peso_interno > 100.0:
            raise BadRequestException("La suma de peso_interno por compromiso no puede exceder 100")

    entity = await okr_subcompromiso_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(OkrSubcompromisoRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_okr_subcompromiso(
    entity_in: OkrSubcompromisoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: OkrSubcompromiso = Depends(require_ownership(okr_subcompromiso_svc)),
):
    """Partially update an owned okr_subcompromiso (404 if not owned)."""
    if entity_in.peso_interno is not None:
        compromiso = (
            await db.execute(
                select(OkrCompromiso).where(
                    OkrCompromiso.id == entity.compromiso_id,
                    OkrCompromiso.user_id == current_user.id,
                    OkrCompromiso.deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        if compromiso is None:
            raise NotFoundException("Compromiso no encontrado")
        if compromiso.tipo_medicion.strip().lower() == "subitems":
            current_total = (
                await db.execute(
                    select(func.coalesce(func.sum(OkrSubcompromiso.peso_interno), 0.0)).where(
                        OkrSubcompromiso.compromiso_id == compromiso.id,
                        OkrSubcompromiso.user_id == current_user.id,
                        OkrSubcompromiso.id != entity.id,
                        OkrSubcompromiso.deleted_at.is_(None),
                    )
                )
            ).scalar_one()
            if float(current_total) + entity_in.peso_interno > 100.0:
                raise BadRequestException("La suma de peso_interno por compromiso no puede exceder 100")

    updated = await okr_subcompromiso_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(OkrSubcompromisoRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_okr_subcompromiso(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: OkrSubcompromiso = Depends(require_ownership(okr_subcompromiso_svc)),
):
    """Delete an owned okr_subcompromiso (404 if not owned)."""
    await okr_subcompromiso_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "OkrSubcompromiso deleted"})
