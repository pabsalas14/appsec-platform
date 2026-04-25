"""FiltroGuardado CRUD endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.user import User
from app.models.filtro_guardado import FiltroGuardado
from app.schemas.filtro_guardado import FiltroGuardadoCreate, FiltroGuardadoRead, FiltroGuardadoUpdate
from app.services.filtro_guardado_service import filtro_guardado_svc

router = APIRouter()


@router.get("")
async def list_filtros_guardados(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = 1,
    page_size: int = 50,
):
    """List filtros guardados owned by the current user (paginated)."""
    from sqlalchemy import select, func
    from app.core.response import paginated

    # Enforce pagination limits (S4: Rate limiting)
    page = max(1, page)
    page_size = min(max(1, page_size), 100)  # Cap at 100

    # Get paginated items
    stmt = select(FiltroGuardado).where(
        FiltroGuardado.usuario_id == current_user.id,
        FiltroGuardado.deleted_at.is_(None),
    ).order_by(FiltroGuardado.created_at.desc())

    # Apply pagination
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    # Get total count
    count_stmt = select(func.count(FiltroGuardado.id)).where(
        FiltroGuardado.usuario_id == current_user.id,
        FiltroGuardado.deleted_at.is_(None),
    )
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one_or_none() or 0

    return paginated(
        [FiltroGuardadoRead.model_validate(x).model_dump(mode="json") for x in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/{id}")
async def get_filtro_guardado(
    entity: FiltroGuardado = Depends(require_ownership(filtro_guardado_svc, owner_field="usuario_id")),
):
    """Get a single owned filtro guardado by ID (404 if not owned)."""
    return success(FiltroGuardadoRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_filtro_guardado(
    entity_in: FiltroGuardadoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new filtro guardado for the current user."""
    entity = await filtro_guardado_svc.create(db, entity_in, extra={"usuario_id": current_user.id})
    return success(FiltroGuardadoRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_filtro_guardado(
    entity_in: FiltroGuardadoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: FiltroGuardado = Depends(require_ownership(filtro_guardado_svc, owner_field="usuario_id")),
):
    """Partially update an owned filtro guardado (404 if not owned)."""
    updated = await filtro_guardado_svc.update(
        db, entity.id, entity_in, scope={"usuario_id": current_user.id}
    )
    return success(FiltroGuardadoRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_filtro_guardado(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: FiltroGuardado = Depends(require_ownership(filtro_guardado_svc, owner_field="usuario_id")),
):
    """Delete an owned filtro guardado (404 if not owned)."""
    await filtro_guardado_svc.delete(db, entity.id, scope={"usuario_id": current_user.id})
    return success(None, meta={"message": "FiltroGuardado deleted"})
