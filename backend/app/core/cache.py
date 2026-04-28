"""Lightweight cache abstraction with optional Redis backend."""

from __future__ import annotations

import asyncio
import json
import time
from typing import Any

from app.config import settings
from app.core.logging import logger

try:
    from redis.asyncio import Redis  # type: ignore[import-not-found]
except Exception:  # pragma: no cover - optional dependency in some environments
    Redis = None  # type: ignore[assignment,misc]


_redis_client: Redis | None = None
_redis_init_attempted = False
_memory_cache: dict[str, tuple[float, str]] = {}
_memory_lock = asyncio.Lock()


async def _get_redis() -> Redis | None:
    global _redis_client, _redis_init_attempted
    if _redis_client is not None:
        return _redis_client
    if _redis_init_attempted:
        return None
    _redis_init_attempted = True

    if not settings.REDIS_URL or Redis is None:
        return None

    try:
        client = Redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        await client.ping()
        _redis_client = client
        logger.info("cache.redis_connected", extra={"event": "cache.redis_connected"})
    except Exception as exc:
        logger.warning(
            "cache.redis_unavailable",
            extra={"event": "cache.redis_unavailable", "error": str(exc)},
        )
        _redis_client = None
    return _redis_client


async def cache_get_json(key: str) -> Any | None:
    client = await _get_redis()
    if client is not None:
        raw = await client.get(key)
        return json.loads(raw) if raw else None

    async with _memory_lock:
        entry = _memory_cache.get(key)
        if entry is None:
            return None
        expires_at, raw = entry
        if expires_at <= time.time():
            _memory_cache.pop(key, None)
            return None
        return json.loads(raw)


async def cache_set_json(key: str, value: Any, ttl_seconds: int) -> None:
    raw = json.dumps(value, default=str)
    client = await _get_redis()
    if client is not None:
        await client.set(key, raw, ex=max(1, ttl_seconds))
        return

    async with _memory_lock:
        _memory_cache[key] = (time.time() + max(1, ttl_seconds), raw)


async def cache_delete_prefix(prefix: str) -> None:
    client = await _get_redis()
    if client is not None:
        cursor = 0
        pattern = f"{prefix}*"
        while True:
            cursor, keys = await client.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                await client.delete(*keys)
            if cursor == 0:
                break
        return

    async with _memory_lock:
        for key in list(_memory_cache.keys()):
            if key.startswith(prefix):
                _memory_cache.pop(key, None)
