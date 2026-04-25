"""ChangelogEntrada CRUD endpoints — Fase 20.

Public read: GET list (published only) + GET detail available to any authenticated user.
Mutations: POST / PATCH / DELETE restricted to super_admin / admin only.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.core.response import success
from app.models.user import User
from app.schemas.changelog_entrada import (
    ChangelogEntradaCreate,
    ChangelogEntradaRead,
    ChangelogEntradaUpdate,
)
from app.services.changelog_entrada_service import changelog_entrada_svc

router = APIRouter()


@router.get("")
async def list_changelog_entradas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List published changelog entries (visible to all authenticated users)."""
    items = await changelog_entrada_svc.list(db, filters={"publicado": True})
    return success([
        ChangelogEntradaRead.model_validate(x).model_dump(mode="json")
        for x in items
    ])


@router.get("/all")
async def list_all_changelog_entradas(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("super_admin", "admin")),
):
    """List ALL changelog entries (drafts + published) — super_admin only."""
    items = await changelog_entrada_svc.list(db, filters={})
    return success([
        ChangelogEntradaRead.model_validate(x).model_dump(mode="json")
        for x in items
    ])


@router.get("/{id}")
async def get_changelog_entrada(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single changelog entry by ID."""
    entity = await changelog_entrada_svc.get_or_raise(db, id)
    return success(ChangelogEntradaRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_changelog_entrada(
    entity_in: ChangelogEntradaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "admin")),
):
    """Create a new changelog entry — super_admin only."""
    entity = await changelog_entrada_svc.create(
        db, entity_in, extra={"user_id": current_user.id}
    )
    return success(ChangelogEntradaRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_changelog_entrada(
    id: str,
    entity_in: ChangelogEntradaUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("super_admin", "admin")),
):
    """Update a changelog entry — super_admin only."""
    updated = await changelog_entrada_svc.update(db, id, entity_in)
    return success(ChangelogEntradaRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_changelog_entrada(
    id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("super_admin", "admin")),
):
    """Delete a changelog entry — super_admin only."""
    await changelog_entrada_svc.delete(db, id)
    return success(None, meta={"message": "ChangelogEntrada deleted"})
