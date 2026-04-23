"""
Per-request logging context — stores correlation fields in contextvars so
every ``logger.*`` call inside a request is automatically enriched with
``request_id``, ``user_id``, ``ip``, ``method`` and ``path`` without needing
to thread them through every function call.

The middleware in ``app/main.py`` binds these at request entry and clears
them at exit. ``get_current_user`` additionally binds ``user_id`` once the
token is validated.
"""

from __future__ import annotations

from contextvars import ContextVar
from typing import Any

_EMPTY: dict[str, Any] = {}

request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)
user_id_ctx: ContextVar[str | None] = ContextVar("user_id", default=None)
ip_ctx: ContextVar[str | None] = ContextVar("ip", default=None)
method_ctx: ContextVar[str | None] = ContextVar("method", default=None)
path_ctx: ContextVar[str | None] = ContextVar("path", default=None)
user_agent_ctx: ContextVar[str | None] = ContextVar("user_agent", default=None)


_CTX_MAP = {
    "request_id": request_id_ctx,
    "user_id": user_id_ctx,
    "ip": ip_ctx,
    "method": method_ctx,
    "path": path_ctx,
    "user_agent": user_agent_ctx,
}


def bind(**fields: Any) -> None:
    """Bind one or more context fields. Unknown fields are ignored."""
    for key, value in fields.items():
        ctx = _CTX_MAP.get(key)
        if ctx is not None:
            ctx.set(str(value) if value is not None else None)


def clear() -> None:
    """Reset every binding to its default (None)."""
    for ctx in _CTX_MAP.values():
        ctx.set(None)


def snapshot() -> dict[str, Any]:
    """Return a plain dict with the current (non-None) context fields."""
    out: dict[str, Any] = {}
    for key, ctx in _CTX_MAP.items():
        val = ctx.get()
        if val is not None:
            out[key] = val
    return out
