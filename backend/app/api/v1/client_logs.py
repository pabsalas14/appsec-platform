"""
Frontend log ingestion endpoint.

The browser-side ``@/lib/logger`` batches entries and flushes them here. On
arrival we forward each entry to the backend's structured logger with
``source="frontend"`` so everything ends up in the same aggregator.

Rate-limiting is intentionally simple (in-memory counter per user, reset
every minute) — sufficient to guard against misconfigured clients. Deploy
behind a real WAF / Nginx rate-limit for abuse protection.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.config import settings
from app.core.logging import logger
from app.core.response import success
from app.models.user import User

router = APIRouter()


class ClientLogEntry(BaseModel):
    level: Literal["debug", "info", "warn", "error"] = "info"
    event: str = Field(min_length=1, max_length=128)
    ts: str | None = None
    data: dict[str, Any] | None = None
    pathname: str | None = Field(default=None, max_length=512)
    request_id: str | None = Field(default=None, max_length=64)
    version: str | None = Field(default=None, max_length=64)


class ClientLogBatch(BaseModel):
    entries: list[ClientLogEntry] = Field(default_factory=list, max_length=200)


_LEVEL_MAP: dict[str, int] = {
    "debug": logging.DEBUG,
    "info": logging.INFO,
    "warn": logging.WARNING,
    "error": logging.ERROR,
}


# user_id → (window_start_epoch, count)
_rate_state: dict[str, tuple[float, int]] = {}


def _check_rate_limit(user_id: str) -> None:
    now = time.monotonic()
    window_start, count = _rate_state.get(user_id, (now, 0))
    if now - window_start >= 60:
        window_start, count = now, 0
    count += 1
    _rate_state[user_id] = (window_start, count)
    if count > settings.CLIENT_LOGS_RATE_LIMIT_PER_MIN:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Client log ingestion rate limit exceeded",
        )


@router.post("", status_code=202)
async def ingest_client_logs(
    batch: ClientLogBatch,
    current_user: User = Depends(get_current_user),
):
    """Forward a batch of frontend log entries to the backend logger."""
    if len(batch.entries) > settings.CLIENT_LOGS_MAX_BATCH:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Batch exceeds CLIENT_LOGS_MAX_BATCH={settings.CLIENT_LOGS_MAX_BATCH}",
        )

    _check_rate_limit(str(current_user.id))

    for entry in batch.entries:
        logger.log(
            _LEVEL_MAP[entry.level],
            entry.event,
            extra={
                "event": entry.event,
                "source": "frontend",
                "user_id": str(current_user.id),
                "client_pathname": entry.pathname,
                "client_request_id": entry.request_id,
                "client_version": entry.version,
                "client_ts": entry.ts,
                "client_data": entry.data or {},
            },
        )

    return success({"accepted": len(batch.entries)})
