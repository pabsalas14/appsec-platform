"""RevisionSourceCode CRUD endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.revision_source_code import RevisionSourceCode
from app.models.user import User
from app.schemas.revision_source_code import (
    RevisionSourceCodeCreate,
    RevisionSourceCodeRead,
    RevisionSourceCodeUpdate,
)
from app.services.revision_source_code_service import revision_source_code_svc

router = APIRouter()


@router.get("")
async def list_revision_source_codes(
    programa_sc_id: UUID | None = Query(None, description="Filter by programa_sc_id"),
    control_sc_id: UUID | None = Query(None, description="Filter by control_sc_id"),
    resultado: str | None = Query(None, max_length=50, description="Cumple | No Cumple | Parcial | No Aplica"),
    q: str | None = Query(None, max_length=200, description="Búsqueda en notas"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List revisiones source code, optionally filtered. BRD §5.4 / F3."""
    from sqlalchemy import select

    conds = [
        RevisionSourceCode.user_id == current_user.id,
        RevisionSourceCode.deleted_at.is_(None),
    ]
    if programa_sc_id is not None:
        conds.append(RevisionSourceCode.programa_sc_id == programa_sc_id)
    if control_sc_id is not None:
        conds.append(RevisionSourceCode.control_sc_id == control_sc_id)
    if resultado and resultado.strip():
        conds.append(RevisionSourceCode.resultado == resultado.strip())
    if q and q.strip():
        conds.append(RevisionSourceCode.notas.ilike(f"%{q.strip()}%"))
    res = await db.execute(select(RevisionSourceCode).where(*conds).order_by(RevisionSourceCode.fecha_revision.desc()))
    items = res.scalars().all()
    return success([RevisionSourceCodeRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_revision_source_code(
    entity: RevisionSourceCode = Depends(require_ownership(revision_source_code_svc)),
):
    """Get a single owned revision source code by ID."""
    return success(RevisionSourceCodeRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_revision_source_code(
    entity_in: RevisionSourceCodeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new revision source code for the current user."""
    entity = await revision_source_code_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(RevisionSourceCodeRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_revision_source_code(
    entity_in: RevisionSourceCodeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: RevisionSourceCode = Depends(require_ownership(revision_source_code_svc)),
):
    """Partially update an owned revision source code."""
    updated = await revision_source_code_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(RevisionSourceCodeRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_revision_source_code(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: RevisionSourceCode = Depends(require_ownership(revision_source_code_svc)),
):
    """Delete an owned revision source code."""
    await revision_source_code_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "RevisionSourceCode deleted"})
