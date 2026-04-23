"""
Database seed script — bootstraps initial data for the framework.

Creates a default admin user using ADMIN_EMAIL and ADMIN_PASSWORD
from the environment. Safe to run multiple times (idempotent).

Usage:
    python -m app.seed
    make seed
"""

import asyncio
import logging

from sqlalchemy import select

from app.config import settings
from app.core.security import hash_password, validate_password_strength
from app.database import async_session
from app.models.user import User

logger = logging.getLogger(__name__)


async def seed() -> None:
    """Create the initial admin user if it doesn't exist."""

    async with async_session() as db, db.begin():
        result = await db.execute(select(User).where(User.username == "admin"))
        existing = result.scalar_one_or_none()

        if existing:
            logger.info(
                "✅ Admin user already exists (id=%s) — skipping seed", existing.id
            )
            return

        validate_password_strength(settings.ADMIN_PASSWORD, username="admin")
        admin = User(
            username="admin",
            email=settings.ADMIN_EMAIL,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            full_name="Administrator",
            role="admin",
            is_active=True,
        )
        db.add(admin)
        await db.flush()
        await db.refresh(admin)

        logger.info("🌱 Created admin user: %s (id=%s)", admin.username, admin.id)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed())
