"""Admin Roles & Permissions endpoints.

The roles/permissions tables are a navigable demo of a many-to-many pattern.
They do not gate requests (see ADR-0008); the authoritative check stays at
``require_role('admin'|'user')`` based on ``users.role: str``.

Permissions are seeded from ``app.core.permissions.P`` on first access — if the
``permissions`` table is empty when this router is hit, it auto-populates so a
fresh clone of the template "just works".
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.core.exceptions import ConflictException, NotFoundException
from app.core.permissions import VALID_ROLES
from app.core.response import success
from app.models.role import Permission, Role
from app.models.user import User
from app.schemas.role import (
    PermissionRead,
    RoleCreate,
    RoleRead,
    RoleUpdate,
)
from app.services.audit_service import record as audit_record

router = APIRouter()


async def _ensure_seeded(db: AsyncSession) -> None:
    """Populate ``permissions`` + default roles on first access."""
    from app.services.permission_seed import ensure_roles_permissions_seeded

    await ensure_roles_permissions_seeded(db)


def _to_read(role: Role) -> dict:
    return RoleRead(
        id=role.id,
        name=role.name,
        description=role.description,
        permissions=sorted(p.code for p in role.permissions),
        created_at=role.created_at,
        updated_at=role.updated_at,
    ).model_dump(mode="json")


@router.get("")
async def list_roles(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """List all roles (auto-seeds on first access)."""
    await _ensure_seeded(db)
    roles = (await db.execute(select(Role).order_by(Role.name))).scalars().all()
    return success([_to_read(r) for r in roles])


@router.get("/_permissions")
async def list_permissions(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """List the full permission catalogue — used by the role editor."""
    await _ensure_seeded(db)
    perms = (await db.execute(select(Permission).order_by(Permission.code))).scalars().all()
    return success(
        [PermissionRead.model_validate(p).model_dump(mode="json") for p in perms]
    )


@router.get("/{role_id}")
async def get_role(
    role_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """Return a single role."""
    role = (await db.execute(select(Role).where(Role.id == role_id))).scalar_one_or_none()
    if not role:
        raise NotFoundException("Role not found")
    return success(_to_read(role))


@router.post("", status_code=201)
async def create_role(
    payload: RoleCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """Create a new role with the given permission codes."""
    await _ensure_seeded(db)
    dup = await db.execute(select(Role).where(Role.name == payload.name))
    if dup.scalar_one_or_none():
        raise ConflictException("Role name already exists")

    perms = []
    if payload.permissions:
        perms = (
            await db.execute(
                select(Permission).where(Permission.code.in_(payload.permissions))
            )
        ).scalars().all()

    role = Role(
        name=payload.name, description=payload.description, permissions=list(perms)
    )
    db.add(role)
    await db.flush()
    await db.refresh(role)

    await audit_record(
        db,
        action="role.create",
        entity_type="roles",
        entity_id=role.id,
        metadata={"name": role.name, "permissions": [p.code for p in perms]},
    )
    return success(_to_read(role))


@router.patch("/{role_id}")
async def update_role(
    role_id: uuid.UUID,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """Update role description and/or permission set."""
    role = (await db.execute(select(Role).where(Role.id == role_id))).scalar_one_or_none()
    if not role:
        raise NotFoundException("Role not found")

    if payload.description is not None:
        role.description = payload.description
    if payload.permissions is not None:
        role.permissions = list(
            (
                await db.execute(
                    select(Permission).where(Permission.code.in_(payload.permissions))
                )
            )
            .scalars()
            .all()
        )

    await db.flush()
    await db.refresh(role)

    await audit_record(
        db,
        action="role.update",
        entity_type="roles",
        entity_id=role.id,
        metadata={"name": role.name},
    )
    return success(_to_read(role))


@router.delete("/{role_id}")
async def delete_role(
    role_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """Delete a role (not allowed for seeded canonical names)."""
    role = (await db.execute(select(Role).where(Role.id == role_id))).scalar_one_or_none()
    if not role:
        raise NotFoundException("Role not found")
    if role.name in VALID_ROLES:
        raise ConflictException(f"Cannot delete built-in role {role.name!r}")

    await db.delete(role)
    await db.flush()

    await audit_record(
        db, action="role.delete", entity_type="roles", entity_id=role_id
    )
    return success(None, meta={"message": "Role deleted"})
