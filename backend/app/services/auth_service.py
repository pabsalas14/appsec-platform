"""
Authentication service — thin wrapper around core.security utilities.

Provides business-logic functions for authentication workflows.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import verify_password
from app.models.user import User


async def authenticate_user(db: AsyncSession, username: str, password: str) -> User | None:
    """Verify credentials and return the User, or None if invalid."""
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user
