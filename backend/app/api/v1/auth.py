"""Authentication endpoints — login, register, refresh, logout, me."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.config import settings
from app.core.cookies import (
    clear_auth_cookies,
    set_access_cookie,
    set_csrf_cookie,
    set_refresh_cookie,
)
from app.core.csrf import issue_csrf_token
from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.logging import logger
from app.core.logging_context import bind as bind_ctx
from app.core.rate_limit import (
    clear_login_failures,
    enforce_login_cooldown,
    enforce_rate_limit,
    register_login_failure,
)
from app.core.response import error as error_response, success
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_refresh_token,
    validate_password_strength,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import (
    AuthSessionRead,
    LoginRequest,
    PasswordChange,
    ProfileUpdate,
    UserCreate,
    UserRead,
)
from app.services.audit_service import record as audit_record

router = APIRouter()


def _mask_email(email: str) -> str:
    """Return a PII-safe representation of an email for logs.

    ``jane.doe@example.com`` → ``j***@example.com``
    """
    if not email or "@" not in email:
        return "***"
    local, _, domain = email.partition("@")
    if not local:
        return f"***@{domain}"
    return f"{local[0]}***@{domain}"


# ─── Helpers ────────────────────────────────────────────────────────────────


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()
    return request.client.host if request.client else "unknown"


def _login_limit_key(request: Request, username: str) -> str:
    return f"{_client_ip(request)}:{username.lower()}"


async def _revoke_refresh_family(
    db: AsyncSession,
    *,
    family_id: uuid.UUID,
    now: datetime,
) -> None:
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.family_id == family_id)
        .values(revoked_at=now, session_revoked_at=now)
    )


async def _issue_tokens(
    db: AsyncSession,
    user: User,
    response: Response,
    *,
    family_id: uuid.UUID | None = None,
    parent_token_id: uuid.UUID | None = None,
) -> AuthSessionRead:
    """Mint access + refresh tokens, persist rotation metadata, set cookies."""
    family_id = family_id or uuid.uuid4()
    access = create_access_token(user.id, user.role, family_id)
    refresh = create_refresh_token(user.id)
    csrf_token = issue_csrf_token()

    db.add(
        RefreshToken(
            user_id=user.id,
            family_id=family_id,
            parent_token_id=parent_token_id,
            token_hash=hash_refresh_token(refresh),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS),
        )
    )
    await db.flush()

    set_access_cookie(response, access)
    set_refresh_cookie(response, refresh)
    set_csrf_cookie(response, csrf_token)
    return AuthSessionRead(user=UserRead.model_validate(user))


# ─── Routes ─────────────────────────────────────────────────────────────────


@router.post("/login")
async def login(
    credentials: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate and create a cookie-backed session."""
    from app.services.auth_service import authenticate_user  # local import to avoid cycles

    limit_key = _login_limit_key(request, credentials.username)
    enforce_rate_limit(
        bucket="auth.login",
        key=limit_key,
        limit=settings.AUTH_LOGIN_RATE_LIMIT_PER_MIN,
    )
    enforce_login_cooldown(limit_key)

    user = await authenticate_user(db, credentials.username, credentials.password)
    if not user:
        register_login_failure(limit_key)
        logger.warning(
            "auth.login_failure",
            extra={
                "event": "auth.login_failure",
                "username": credentials.username,
                "ip": _client_ip(request),
            },
        )
        raise UnauthorizedException("Incorrect username or password")

    clear_login_failures(limit_key)
    session = await _issue_tokens(db, user, response)

    bind_ctx(user_id=str(user.id))
    logger.info(
        "auth.login_success",
        extra={
            "event": "auth.login_success",
            "user_id": str(user.id),
            "role": user.role,
            "email_masked": _mask_email(user.email),
        },
    )

    return success(session.model_dump(mode="json"))


@router.post("/register", status_code=201)
async def register(
    user_in: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    enforce_rate_limit(
        bucket="auth.register",
        key=_client_ip(request),
        limit=settings.AUTH_REGISTER_RATE_LIMIT_PER_MIN,
    )
    existing = await db.execute(
        select(User).where(
            (User.username == user_in.username) | (User.email == user_in.email)
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictException("Username or email already registered")

    validate_password_strength(user_in.password, username=user_in.username)
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role="user",
    )
    db.add(db_user)
    await db.flush()
    await db.refresh(db_user)

    logger.info(
        "auth.register",
        extra={
            "event": "auth.register",
            "user_id": str(db_user.id),
            "role": db_user.role,
            "email_masked": _mask_email(db_user.email),
        },
    )

    return success(UserRead.model_validate(db_user).model_dump(mode="json"))


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    """Rotate refresh token: validate, revoke old, emit new pair, set cookies.

    The incoming refresh token is read from the ``refresh_token`` HttpOnly
    cookie. On success we:

    1. Decode JWT and check ``type == 'refresh'``.
    2. Look up its hash in ``refresh_tokens`` and verify it is not revoked
       and not expired.
    3. Mark the old row ``revoked_at = now()`` (single-use, rotation).
    4. Persist a fresh refresh row and set both cookies.
    """
    enforce_rate_limit(
        bucket="auth.refresh",
        key=_client_ip(request),
        limit=settings.AUTH_REFRESH_RATE_LIMIT_PER_MIN,
    )
    if not refresh_token:
        raise UnauthorizedException("Refresh token not provided")

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid refresh token")

    token_hash = hash_refresh_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    stored = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if stored is None:
        raise UnauthorizedException("Refresh token is revoked or expired")

    if stored.session_revoked_at is not None:
        raise UnauthorizedException("Session has been revoked")

    if stored.revoked_at is not None:
        await _revoke_refresh_family(db, family_id=stored.family_id, now=now)
        logger.warning(
            "auth.refresh_reuse_detected",
            extra={
                "event": "auth.refresh_reuse_detected",
                "user_id": str(stored.user_id),
                "family_id": str(stored.family_id),
            },
        )
        await audit_record(
            db,
            action="auth.refresh_reuse_detected",
            entity_type="refresh_tokens",
            entity_id=stored.id,
            actor_id=stored.user_id,
            status="blocked",
            metadata={"family_id": str(stored.family_id)},
        )
        clear_auth_cookies(response)
        return JSONResponse(
            status_code=401,
            content=error_response(
                "Refresh token is revoked or expired",
                code="UnauthorizedException",
            ),
            headers=response.headers,
        )

    if stored.expires_at < now:
        raise UnauthorizedException("Refresh token is revoked or expired")

    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.id == stored.id)
        .values(revoked_at=now)
    )

    user_id = uuid.UUID(payload["sub"])
    user_res = await db.execute(
        select(User).where(User.id == user_id, User.is_active.is_(True))
    )
    user = user_res.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("User not found")

    session = await _issue_tokens(
        db,
        user,
        response,
        family_id=stored.family_id,
        parent_token_id=stored.id,
    )

    bind_ctx(user_id=str(user.id))
    logger.info(
        "auth.refresh",
        extra={"event": "auth.refresh", "user_id": str(user.id)},
    )

    return success(session.model_dump(mode="json"))


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    """Invalidate the current session family (if any) and clear auth cookies."""
    if refresh_token:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == hash_refresh_token(refresh_token)
            )
        )
        stored = result.scalar_one_or_none()
        if stored is not None:
            await _revoke_refresh_family(db, family_id=stored.family_id, now=now)
            await audit_record(
                db,
                action="auth.logout",
                entity_type="refresh_tokens",
                entity_id=stored.id,
                actor_id=stored.user_id,
                metadata={"family_id": str(stored.family_id)},
            )

    clear_auth_cookies(response)
    logger.info("auth.logout", extra={"event": "auth.logout"})
    return success(None, meta={"message": "Logged out"})


@router.get("/me")
async def me(
    current_user: User = Depends(get_current_user),
):
    """Return the current authenticated user."""
    return success(UserRead.model_validate(current_user).model_dump(mode="json"))


@router.patch("/me")
async def update_me(
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Self-service profile edit — full name and email only."""
    if payload.email is not None and payload.email != current_user.email:
        existing = await db.execute(
            select(User).where(User.email == payload.email, User.id != current_user.id)
        )
        if existing.scalar_one_or_none():
            raise ConflictException("Email already in use")
        current_user.email = payload.email

    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    await db.flush()
    await db.refresh(current_user)

    await audit_record(
        db,
        action="user.profile_update",
        entity_type="users",
        entity_id=current_user.id,
    )
    return success(UserRead.model_validate(current_user).model_dump(mode="json"))


@router.post("/me/password")
async def change_password(
    payload: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change the current user's password."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise UnauthorizedException("Current password is incorrect")
    validate_password_strength(payload.new_password, username=current_user.username)

    current_user.hashed_password = hash_password(payload.new_password)
    await db.flush()

    await audit_record(
        db,
        action="user.password_change",
        entity_type="users",
        entity_id=current_user.id,
    )
    return success(None, meta={"message": "Password changed"})
