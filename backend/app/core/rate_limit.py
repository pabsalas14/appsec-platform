"""
Simple in-memory rate limiting and login cooldown helpers.

This protects single-process deployments and local development. Production
multi-instance deployments should enforce equivalent or stronger limits at the
edge or via a shared store.
"""

from __future__ import annotations

import time

from app.config import settings
from app.core.exceptions import TooManyRequestsException

WindowState = tuple[float, int]
FailureState = tuple[int, float]

_windows: dict[str, WindowState] = {}
_login_failures: dict[str, FailureState] = {}


def reset_rate_limit_state() -> None:
    _windows.clear()
    _login_failures.clear()


def enforce_rate_limit(*, bucket: str, key: str, limit: int, window_seconds: int = 60) -> None:
    now = time.monotonic()
    state_key = f"{bucket}:{key}"
    window_start, count = _windows.get(state_key, (now, 0))
    if now - window_start >= window_seconds:
        window_start, count = now, 0
    count += 1
    _windows[state_key] = (window_start, count)
    if count > limit:
        raise TooManyRequestsException("Rate limit exceeded for this endpoint")


def enforce_login_cooldown(key: str) -> None:
    count, locked_until = _login_failures.get(key, (0, 0.0))
    remaining = locked_until - time.monotonic()
    if remaining > 0:
        minutes = settings.AUTH_LOCKOUT_MINUTES
        raise TooManyRequestsException(
            f"Too many failed login attempts. Try again in {minutes} minutes."
        )
    if locked_until:
        _login_failures.pop(key, None)


def register_login_failure(key: str) -> None:
    count, locked_until = _login_failures.get(key, (0, 0.0))
    now = time.monotonic()
    if locked_until and locked_until > now:
        return

    count += 1
    if count >= settings.AUTH_LOCKOUT_THRESHOLD:
        _login_failures[key] = (
            count,
            now + (settings.AUTH_LOCKOUT_MINUTES * 60),
        )
        return

    _login_failures[key] = (count, 0.0)


def clear_login_failures(key: str) -> None:
    _login_failures.pop(key, None)
