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

import hashlib
import uuid
from typing import Any

from sqlalchemy import select, text
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

    # Serialize audit chain updates to avoid forked hash-chains under concurrency.
    # pg_advisory_xact_lock blocks only within the current transaction.
    await db.execute(text("SELECT pg_advisory_xact_lock(9223372036854775707)"))

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
    await db.refresh(entry)

    await _append_hash_chain(db, entry)

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


async def _append_hash_chain(db: AsyncSession, entry: AuditLog) -> None:
    """Compute and store (prev_hash, row_hash) for a new entry (A4)."""
    prev = (
        (
            await db.execute(
                select(AuditLog.row_hash)
                .where(AuditLog.row_hash.is_not(None))
                .where(AuditLog.id != entry.id)
                .order_by(AuditLog.ts.desc(), AuditLog.id.desc())
                .limit(1)
            )
        )
        .scalars()
        .first()
    )
    entry.prev_hash = prev
    entry.row_hash = _audit_row_hash(entry, prev_hash=prev)
    await db.flush()


async def validate_chain(db: AsyncSession, *, limit: int = 5000) -> dict[str, Any]:
    """Validate audit log hash-chain (A4). Returns summary + first failure, if any."""
    rows = (
        (
            await db.execute(
                select(AuditLog)
                .order_by(AuditLog.ts.asc(), AuditLog.id.asc())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    prev: str | None = None
    for r in rows:
        expected = _audit_row_hash(r, prev_hash=prev)
        if r.prev_hash != prev or r.row_hash != expected:
            return {
                "ok": False,
                "checked": len(rows),
                "failed_at_id": str(r.id),
                "expected_prev_hash": prev,
                "actual_prev_hash": r.prev_hash,
                "expected_row_hash": expected,
                "actual_row_hash": r.row_hash,
            }
        prev = r.row_hash
    return {"ok": True, "checked": len(rows), "last_hash": prev}


def _audit_row_hash(entry: AuditLog, *, prev_hash: str | None) -> str:
    # Keep this stable across versions; do NOT include row_hash itself.
    parts: list[str] = [
        "v1",
        prev_hash or "",
        str(entry.id),
        str(entry.ts),
        str(entry.actor_user_id) if entry.actor_user_id else "",
        entry.action or "",
        entry.entity_type or "",
        entry.entity_id or "",
        str(entry.ip) if entry.ip else "",
        entry.user_agent or "",
        entry.request_id or "",
        entry.status or "",
        _stable_json(entry.meta or {}),
    ]
    payload = "\n".join(parts).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _stable_json(value: Any) -> str:
    import json

    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _coerce_uuid(value: Any) -> uuid.UUID | None:
    if value is None:
        return None
    if isinstance(value, uuid.UUID):
        return value
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError):
        return None
