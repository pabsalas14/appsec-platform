"""Admin User management endpoints — ``/api/v1/admin/users``.

All routes require ``role=admin``. Mutations write audit entries via
``user_admin_svc`` (prefix ``user.*``).
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.core.permissions import VALID_ROLES
from app.core.response import paginated, success
from app.core.security import hash_password, validate_password_strength
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad
from app.models.service_release import ServiceRelease
from app.models.tema_emergente import TemaEmergente
from app.models.iniciativa import Iniciativa
from app.models.okr_compromiso import OkrCompromiso
from app.schemas.user_admin import (
    UserAdminCreate,
    UserAdminRead,
    UserAdminUpdate,
    UserPasswordReset,
)
from app.services.audit_service import record as audit_record
from app.services.user_admin_service import user_admin_svc

router = APIRouter()


class OwnershipReassignRequest(BaseModel):
    from_user_id: uuid.UUID
    to_user_id: uuid.UUID
    entities: list[str] = Field(
        default_factory=lambda: ["vulnerabilidads", "service_releases", "tema_emergentes", "iniciativas", "okr_compromisos"]
    )


def _ensure_valid_role(role: str) -> None:
    if role not in VALID_ROLES:
        raise ConflictException(f"Invalid role {role!r}. Valid roles: {', '.join(VALID_ROLES)}")


@router.get("")
async def list_users(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
    role: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    q: str | None = Query(default=None, description="Search by username/email"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=200),
):
    """List all users with optional filters (admin only)."""
    filters = []
    if role:
        filters.append(User.role == role)
    if is_active is not None:
        filters.append(User.is_active.is_(is_active))
    if q:
        like = f"%{q.lower()}%"
        filters.append(func.lower(User.username).like(like) | func.lower(User.email).like(like))

    count_stmt = select(func.count()).select_from(User)
    for f in filters:
        count_stmt = count_stmt.where(f)
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = select(User)
    for f in filters:
        stmt = stmt.where(f)
    stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()

    return paginated(
        [UserAdminRead.model_validate(u).model_dump(mode="json") for u in rows],
        page=page,
        page_size=page_size,
        total=int(total),
    )


@router.get("/{user_id}")
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Return a single user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")
    return success(UserAdminRead.model_validate(user).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_user(
    payload: UserAdminCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Create a user account (admin only).

    Enforces unique username/email and valid role. The plaintext password
    is never stored or logged (only the bcrypt hash).
    """
    _ensure_valid_role(payload.role)

    dup_stmt = select(User).where((User.username == payload.username) | (User.email == payload.email))
    if (await db.execute(dup_stmt)).scalar_one_or_none():
        raise ConflictException("Username or email already registered")

    validate_password_strength(payload.password, username=payload.username)
    new_user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)

    await audit_record(
        db,
        action="user.create",
        entity_type="users",
        entity_id=new_user.id,
        metadata={"created_by_admin": True, "role": new_user.role},
    )

    return success(UserAdminRead.model_validate(new_user).model_dump(mode="json"))


@router.patch("/{user_id}")
async def update_user(
    user_id: uuid.UUID,
    payload: UserAdminUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Partially update a user (admin only)."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")

    if payload.role is not None:
        _ensure_valid_role(payload.role)

    if payload.email is not None and payload.email != user.email:
        dup = await db.execute(select(User).where(User.email == payload.email, User.id != user_id))
        if dup.scalar_one_or_none():
            raise ConflictException("Email already in use")

    if admin.id == user_id and payload.role is not None and payload.role != "admin":
        # prevent the admin from demoting themselves out of admin
        raise ForbiddenException("Admins cannot demote themselves")
    if admin.id == user_id and payload.is_active is False:
        raise ForbiddenException("Admins cannot deactivate themselves")

    changes = payload.model_dump(exclude_unset=True)
    for k, v in changes.items():
        setattr(user, k, v)

    await db.flush()
    await db.refresh(user)

    await audit_record(
        db,
        action="user.update",
        entity_type="users",
        entity_id=user.id,
        metadata={"changes": {k: str(v) for k, v in changes.items()}},
    )

    return success(UserAdminRead.model_validate(user).model_dump(mode="json"))


@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: uuid.UUID,
    payload: UserPasswordReset,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Reset a user's password to a new value (admin only)."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")

    validate_password_strength(payload.new_password, username=user.username)
    user.hashed_password = hash_password(payload.new_password)
    await db.flush()

    await audit_record(
        db,
        action="user.password_reset",
        entity_type="users",
        entity_id=user.id,
        metadata={"by_admin": True},
    )

    return success(None, meta={"message": "Password reset"})


@router.delete("/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Delete a user (admin only). Cannot delete yourself."""
    if admin.id == user_id:
        raise ForbiddenException("Admins cannot delete themselves")

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")

    await db.delete(user)
    await db.flush()

    await audit_record(
        db,
        action="user.delete",
        entity_type="users",
        entity_id=user_id,
    )

    return success(None, meta={"message": "User deleted"})


@router.post("/reassign-ownership")
async def reassign_ownership(
    payload: OwnershipReassignRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_backoffice),
):
    """Mass-reassign record ownership during offboarding.

    Reassigns `user_id` across selected owned entities.
    """
    if payload.from_user_id == payload.to_user_id:
        raise ConflictException("from_user_id and to_user_id must be different")

    origin = (await db.execute(select(User).where(User.id == payload.from_user_id))).scalar_one_or_none()
    target = (await db.execute(select(User).where(User.id == payload.to_user_id))).scalar_one_or_none()
    if not origin:
        raise NotFoundException("Origin user not found")
    if not target:
        raise NotFoundException("Target user not found")

    model_map = {
        "vulnerabilidads": Vulnerabilidad,
        "service_releases": ServiceRelease,
        "tema_emergentes": TemaEmergente,
        "iniciativas": Iniciativa,
        "okr_compromisos": OkrCompromiso,
    }
    selected = [e for e in payload.entities if e in model_map]
    if not selected:
        raise ConflictException("No valid entities requested")

    updated: dict[str, int] = {}
    for entity in selected:
        model = model_map[entity]
        stmt = (
            update(model)
            .where(model.user_id == payload.from_user_id, model.deleted_at.is_(None))
            .values(user_id=payload.to_user_id)
        )
        result = await db.execute(stmt)
        updated[entity] = int(result.rowcount or 0)

    await audit_record(
        db,
        action="user.reassign_ownership",
        entity_type="users",
        entity_id=payload.from_user_id,
        metadata={
            "to_user_id": str(payload.to_user_id),
            "updated": updated,
            "requested_entities": payload.entities,
            "performed_by": str(admin.id),
        },
    )
    return success({"from_user_id": str(payload.from_user_id), "to_user_id": str(payload.to_user_id), "updated": updated})


# Silence unused-import warnings for convenience exports above.
_ = user_admin_svc
