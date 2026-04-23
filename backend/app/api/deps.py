"""
Framework authentication & authorisation dependencies.

Provides:
    get_current_user  — resolve the authenticated user from JWT / cookie
    require_role      — dependency factory that restricts by role
    validate_fk_exists — generic FK existence check
"""

import uuid
from typing import Any, Optional

from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.core.logging_context import bind as bind_ctx
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException


# ─── Authentication ─────────────────────────────────────────────────────────

async def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer <token>"),
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Authenticate via Bearer header or HttpOnly cookie.

    Priority: Authorization header → access_token cookie.
    """
    token: str | None = None

    # 1. Prefer Authorization header
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()

    # 2. Fall back to HttpOnly cookie
    if not token and access_token:
        token = access_token

    if not token:
        raise UnauthorizedException("Token not provided")

    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise UnauthorizedException("Invalid or expired token")

    session_id = payload.get("sid")
    if session_id:
        try:
            session_uuid = uuid.UUID(session_id)
        except (TypeError, ValueError):
            raise UnauthorizedException("Invalid or expired token") from None
        revoked_session = await db.execute(
            select(RefreshToken.id).where(
                RefreshToken.family_id == session_uuid,
                RefreshToken.session_revoked_at.is_not(None),
            )
        )
        if revoked_session.scalar_one_or_none() is not None:
            raise UnauthorizedException("Session has been revoked")

    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(
        select(User).where(User.id == user_id, User.is_active == True)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("User not found")

    # Bind user_id into the request-scoped logging context so every log line
    # produced downstream carries it automatically.
    bind_ctx(user_id=str(user.id))

    return user


# ─── Authorisation ───────────────────────────────────────────────────────────

def require_role(*roles: str):
    """Dependency factory that restricts access to specific roles.

    Usage::

        @router.post("/admin-only")
        async def admin_action(
            current_user: User = Depends(require_role("admin")),
        ): ...

    If multiple roles are given, user needs **ANY** of them (OR logic).
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in roles:
            raise ForbiddenException("You do not have permission for this action")
        return current_user
    return role_checker


# ─── Shared helpers ──────────────────────────────────────────────────────────

async def validate_fk_exists(
    db: AsyncSession,
    model: Any,
    record_id: int | uuid.UUID,
    label: str,
) -> None:
    """Validate that a foreign key reference exists. Raises 422 with clear message."""
    result = await db.execute(select(model.id).where(model.id == record_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{label} with id={record_id} does not exist.",
        )
