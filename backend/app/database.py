from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import TypeVar

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_size=20, max_overflow=10)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


T = TypeVar("T")


async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def run_in_transaction(
    fn: Callable[[AsyncSession], Awaitable[T]],
) -> T:
    """
    Misma política de commit/rollback que `get_db` (único sitio de commit, ADR-0003),
    para tareas en segundo plano (p. ej. reglas de notificación programadas).
    """
    async with async_session() as session:
        try:
            out = await fn(session)
            await session.commit()
            return out
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
