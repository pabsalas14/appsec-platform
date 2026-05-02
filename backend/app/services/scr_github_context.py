"""Contexto por request/tarea: token GitHub para cliente SCR (sin pasar parámetro en cada función)."""

from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar
from typing import Generator

_ctx: ContextVar[str | None] = ContextVar("scr_github_bearer", default=None)


def get_scr_github_bearer_override() -> str | None:
    v = _ctx.get()
    return v.strip() if v else None


@contextmanager
def scr_github_bearer_token(token: str | None) -> Generator[None, None, None]:
    t = _ctx.set(token.strip() if token else None)
    try:
        yield
    finally:
        _ctx.reset(t)
