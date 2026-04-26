"""Tests for app.seed — usan el mismo engine que pytest (evita asyncpg + loop global)."""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.catalog import Catalog
from app.models.role import Role
from app.models.user import User
from app.seed import run_seed


async def _run_seed_in_test_session(session_factory: async_sessionmaker[AsyncSession]) -> None:
    async with session_factory() as db, db.begin():
        await run_seed(db)


@pytest.mark.asyncio
async def test_seed_creates_admin(
    _session_factory: async_sessionmaker[AsyncSession],
) -> None:
    await _run_seed_in_test_session(_session_factory)
    async with _session_factory() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        admin = result.scalar_one_or_none()
        assert admin is not None
        assert admin.role == "admin"
        assert admin.is_active is True


@pytest.mark.asyncio
async def test_seed_creates_platform_roles(
    _session_factory: async_sessionmaker[AsyncSession],
) -> None:
    await _run_seed_in_test_session(_session_factory)
    async with _session_factory() as db:
        result = await db.execute(select(Role).where(Role.name == "ciso"))
        assert result.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_seed_inserts_catalog_types(
    _session_factory: async_sessionmaker[AsyncSession],
) -> None:
    await _run_seed_in_test_session(_session_factory)
    async with _session_factory() as db:
        result = await db.execute(select(Catalog))
        rows = result.scalars().all()
        types = {c.type for c in rows}
        assert len(types) >= 1


@pytest.mark.asyncio
async def test_seed_idempotent_admin(
    _session_factory: async_sessionmaker[AsyncSession],
) -> None:
    await _run_seed_in_test_session(_session_factory)
    async with _session_factory() as db:
        r1 = await db.execute(select(User).where(User.username == "admin"))
        first = r1.scalar_one()
    await _run_seed_in_test_session(_session_factory)
    async with _session_factory() as db:
        r2 = await db.execute(select(User).where(User.username == "admin"))
        second = r2.scalar_one()
        assert first.id == second.id
