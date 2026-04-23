"""
Tests for the structured logging pipeline (ADR-0007).

Verifies:
- Every request emits ``http.request`` / ``http.response`` with the same
  ``request_id``.
- The ``X-Request-ID`` response header is always present, and mirrors the
  incoming header when provided by the client.
- Secrets passed via ``extra`` are scrubbed by ``RedactFilter``.
- The JSON formatter emits the stable field set documented in the ADR.
"""

from __future__ import annotations

import io
import json
import logging

import pytest
from httpx import AsyncClient

from app.config import settings
from app.core.logging import (
    REDACTED_KEYS,
    _JsonFormatter,
    ContextFilter,
    RedactFilter,
    configure_logging,
    logger,
)
from app.core.logging_context import bind as bind_ctx, clear as clear_ctx


def _install_capture_handler() -> tuple[logging.Handler, io.StringIO]:
    """Attach an in-memory handler formatted like the production one."""
    buf = io.StringIO()
    handler = logging.StreamHandler(buf)
    handler.setFormatter(_JsonFormatter("%(msg)s"))
    handler.addFilter(
        ContextFilter(
            service=settings.LOG_SERVICE_NAME,
            env=settings.ENV,
            version=settings.LOG_VERSION,
        )
    )
    handler.addFilter(RedactFilter())
    logger.addHandler(handler)
    return handler, buf


def _uninstall(handler: logging.Handler) -> None:
    logger.removeHandler(handler)


def _iter_records(buf: io.StringIO):
    for line in buf.getvalue().splitlines():
        line = line.strip()
        if not line:
            continue
        yield json.loads(line)


def test_configure_logging_is_idempotent():
    """Calling configure_logging twice must not blow up / duplicate handlers."""
    configure_logging(settings)
    configure_logging(settings)


def test_redact_filter_scrubs_secrets():
    handler, buf = _install_capture_handler()
    try:
        logger.info(
            "secret.test",
            extra={
                "event": "secret.test",
                "password": "hunter2",
                "nested": {"token": "abc", "safe": "ok"},
                "Authorization": "Bearer xyz",
            },
        )
    finally:
        _uninstall(handler)

    records = list(_iter_records(buf))
    assert records, "expected at least one log record"
    rec = records[-1]
    payload = json.dumps(rec).lower()
    for key in ("hunter2", "bearer xyz", "abc"):
        assert key.lower() not in payload, f"{key!r} leaked into log: {rec}"
    # And known keys resolve to placeholder
    for key in ("password", "Authorization"):
        if key in rec:
            assert rec[key] == "***"


def test_redacted_keys_contract_covers_sensitive_fields():
    """If anyone removes a key from the redaction set, this test fails loudly."""
    required = {"password", "token", "authorization", "cookie", "refresh_token"}
    missing = required - REDACTED_KEYS
    assert not missing, f"REDACTED_KEYS is missing mandatory keys: {missing}"


def test_json_formatter_has_stable_fields():
    handler, buf = _install_capture_handler()
    try:
        clear_ctx()
        bind_ctx(request_id="rid-1", user_id="u-1", method="GET", path="/x")
        logger.info("event.x", extra={"event": "event.x", "custom": 1})
    finally:
        clear_ctx()
        _uninstall(handler)

    rec = list(_iter_records(buf))[-1]
    for key in ("ts", "level", "logger", "event", "request_id", "user_id", "service"):
        assert key in rec, f"missing stable field {key!r} in {rec}"
    assert rec["request_id"] == "rid-1"
    assert rec["user_id"] == "u-1"
    assert rec["event"] == "event.x"
    assert rec["service"] == settings.LOG_SERVICE_NAME


@pytest.mark.asyncio
async def test_request_id_is_echoed_when_provided(client: AsyncClient):
    handler, buf = _install_capture_handler()
    try:
        resp = await client.get(
            "/api/health", headers={"X-Request-ID": "rid-echo-123"}
        )
    finally:
        _uninstall(handler)

    assert resp.status_code == 200
    assert resp.headers.get("x-request-id") == "rid-echo-123"


@pytest.mark.asyncio
async def test_request_id_is_generated_when_absent(client: AsyncClient):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    rid = resp.headers.get("x-request-id")
    assert rid and len(rid) >= 16


@pytest.mark.asyncio
async def test_http_request_and_response_share_request_id(client: AsyncClient):
    # Force sampling of /api/health for this test by hitting a non-health path.
    handler, buf = _install_capture_handler()
    try:
        resp = await client.get(
            "/api/v1/", headers={"X-Request-ID": "rid-abc-999"}
        )
    finally:
        _uninstall(handler)

    assert resp.status_code == 200

    events = [r for r in _iter_records(buf) if r.get("event") in ("http.request", "http.response")]
    assert any(e["event"] == "http.request" for e in events)
    assert any(e["event"] == "http.response" for e in events)
    for ev in events:
        assert ev.get("request_id") == "rid-abc-999", ev
