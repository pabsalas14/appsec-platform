"""Promoción a admin por coincidencia de email con ADMIN_EMAIL (seed)."""

import uuid
from unittest.mock import patch

import pytest
from sqlalchemy import select

from app.config import settings
from app.core.security import hash_password
from app.models.user import User
from app.seed import _seed_admin


@pytest.mark.asyncio
async def test_seed_admin_promotes_user_when_email_matches_admin_email(_session_factory):
    """Si ya existe un usuario con el mismo email que ADMIN_EMAIL, se promueve a admin."""
    unique = uuid.uuid4().hex[:8]
    email = f"promote_{unique}@example.com"
    async with _session_factory() as db:
        async with db.begin():
            db.add(
                User(
                    username=f"u_{unique}",
                    email=email,
                    hashed_password=hash_password("Securepass123"),
                    role="user",
                )
            )

    with patch.object(settings, "ADMIN_EMAIL", email):
        async with _session_factory() as db:
            async with db.begin():
                out = await _seed_admin(db)

    assert out.role == "admin"
    assert out.username == f"u_{unique}"
    assert out.email == email

    async with _session_factory() as db:
        row = (await db.execute(select(User).where(User.id == out.id))).scalar_one()
    assert row.role == "admin"


@pytest.mark.asyncio
async def test_seed_admin_creates_username_admin_when_email_free(_session_factory):
    """Sin conflicto de email, se crea el usuario estándar ``admin``."""
    email = f"adminseed_{uuid.uuid4().hex}@example.com"
    with patch.object(settings, "ADMIN_EMAIL", email):
        with patch.object(settings, "ADMIN_PASSWORD", "ValidPass1!"):
            async with _session_factory() as db:
                async with db.begin():
                    out = await _seed_admin(db)

    assert out.username == "admin"
    assert out.email == email
    assert out.role == "admin"
