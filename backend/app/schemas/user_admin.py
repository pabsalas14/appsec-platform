"""Admin-facing User schemas.

Separate from ``schemas/auth.py`` because the admin endpoints expose fields
(``role``, ``is_active``) that normal users cannot set on themselves.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.permissions import VALID_ROLES


class UserAdminRead(BaseModel):
    """Full admin view of a user (password never exposed)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    email: EmailStr
    full_name: str | None = None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserAdminCreate(BaseModel):
    """Admin creates a new user account with an initial password."""

    username: str = Field(min_length=3, max_length=150)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    role: str = Field(default="user")
    is_active: bool = True


class UserAdminUpdate(BaseModel):
    """All fields optional for partial updates."""

    email: EmailStr | None = None
    full_name: str | None = Field(default=None, max_length=255)
    role: str | None = None
    is_active: bool | None = None


class UserPasswordReset(BaseModel):
    """Payload for admin-triggered password reset."""

    new_password: str = Field(min_length=10, max_length=128)


__all__ = [
    "VALID_ROLES",
    "UserAdminCreate",
    "UserAdminRead",
    "UserAdminUpdate",
    "UserPasswordReset",
]
