"""
Audit log service — single entry point to persist ``audit_logs`` rows.

Callers provide ``action``, ``entity_type`` and ``entity_id``. Request-scoped
metadata (``request_id``, ``ip``, ``user_agent``) is read from the
logging contextvars so router / service code doesn't need to thread it
through.

Like every other service in the framework, ``record`` uses ``db.flush()`` —
``get_db`` owns the transaction (ADR-0003).
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.logging import _redact, logger
from app.core.logging_context import snapshot
from app.models.audit_log import AuditLog


async def record(
    db: AsyncSession,
    *,
    action: str,
    entity_type: str | None = None,
    entity_id: Any | None = None,
    actor_id: uuid.UUID | str | None = None,
    status: str = "success",
    metadata: dict[str, Any] | None = None,
) -> AuditLog | None:
    """Persist an audit entry. Returns the inserted row (or None if disabled)."""
    if not settings.AUDIT_LOG_ENABLED:
        return None

    ctx = snapshot()

    entry = AuditLog(
        actor_user_id=_coerce_uuid(actor_id) or _coerce_uuid(ctx.get("user_id")),
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        ip=ctx.get("ip"),
        user_agent=ctx.get("user_agent"),
        request_id=ctx.get("request_id"),
        status=status,
        meta=_redact(metadata or {}),
    )
    db.add(entry)
    await db.flush()

    logger.info(
        action,
        extra={
            "event": action,
            "entity_type": entity_type,
            "entity_id": str(entity_id) if entity_id is not None else None,
            "audit": True,
        },
    )
    return entry


def _coerce_uuid(value: Any) -> uuid.UUID | None:
    if value is None:
        return None
    if isinstance(value, uuid.UUID):
        return value
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError):
        return None
