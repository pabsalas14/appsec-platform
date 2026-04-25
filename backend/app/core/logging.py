"""
Structured logging configuration — single source of truth.

Every backend module uses ``from app.core.logging import logger``. The root
logger is configured by ``configure_logging(settings)`` at app startup and
emits JSON lines to stdout (Docker + Loki/ELK/Datadog-friendly). In dev the
format can be downgraded to human-readable text via ``LOG_FORMAT=text``.

Contract (see ADR-0007):

    {
      "ts": "2026-04-21T12:34:56.789Z",
      "level": "INFO",
      "logger": "app.api.v1.tasks",
      "msg": "task.create",
      "event": "task.create",
      "request_id": "…",
      "user_id": "…",
      "ip": "…",
      "method": "POST",
      "path": "/api/v1/tasks",
      "service": "framework-api",
      "env": "dev",
      "version": "1.0.0",
      "duration_ms": 12.3,
      "status": 201,
      ...
    }

Secrets (``authorization``, ``cookie``, ``password``, ``token``, ``secret``,
``refresh_token``, ``hashed_password``) are unconditionally scrubbed from
every record — including nested dicts passed via ``extra``.
"""

from __future__ import annotations

import logging
import logging.config
import sys
from datetime import UTC, datetime
from typing import Any

from pythonjsonlogger import jsonlogger

from app.core.logging_context import snapshot

# ─── Redaction ─────────────────────────────────────────────────────────────

REDACTED_KEYS: frozenset[str] = frozenset(
    {
        "authorization",
        "cookie",
        "cookies",
        "password",
        "hashed_password",
        "token",
        "access_token",
        "refresh_token",
        "secret",
        "secret_key",
        "api_key",
        "set-cookie",
    }
)
_REDACTED_PLACEHOLDER = "***"


def _redact(value: Any, _depth: int = 0) -> Any:
    """Recursively scrub secret-looking keys from dicts / lists."""
    if _depth > 6:
        return value
    if isinstance(value, dict):
        return {
            k: (_REDACTED_PLACEHOLDER if isinstance(k, str) and k.lower() in REDACTED_KEYS else _redact(v, _depth + 1))
            for k, v in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [_redact(v, _depth + 1) for v in value]
    return value


class RedactFilter(logging.Filter):
    """Filter that scrubs secret-looking fields from every record."""

    def filter(self, record: logging.LogRecord) -> bool:
        # Some stdlib integrations (uvicorn + multiprocessing) pass positional
        # args to ``logger.info(msg, *args)`` which serialize across process
        # boundaries as a ``list`` instead of a ``tuple``. Python's
        # ``LogRecord.getMessage`` then raises ``TypeError`` on ``msg %
        # self.args``. Normalise here so every downstream handler is safe.
        if isinstance(record.args, list):
            record.args = tuple(record.args)
        for attr, val in list(record.__dict__.items()):
            if isinstance(attr, str) and attr.lower() in REDACTED_KEYS:
                setattr(record, attr, _REDACTED_PLACEHOLDER)
            elif attr == "args":
                continue
            elif isinstance(val, (dict, list, tuple)):
                setattr(record, attr, _redact(val))
        return True


# ─── Context enrichment ────────────────────────────────────────────────────


class ContextFilter(logging.Filter):
    """Copy request-scoped contextvars onto every record."""

    def __init__(self, service: str, env: str, version: str) -> None:
        super().__init__()
        self._service = service
        self._env = env
        self._version = version

    def filter(self, record: logging.LogRecord) -> bool:
        record.service = self._service
        record.env = self._env
        record.version = self._version
        for key, val in snapshot().items():
            setattr(record, key, val)
        return True


# ─── JSON formatter ────────────────────────────────────────────────────────


class _JsonFormatter(jsonlogger.JsonFormatter):
    """JSON formatter that emits ISO-8601 UTC ``ts`` and a stable field set."""

    def add_fields(
        self,
        log_record: dict[str, Any],
        record: logging.LogRecord,
        message_dict: dict[str, Any],
    ) -> None:
        super().add_fields(log_record, record, message_dict)
        log_record["ts"] = (
            datetime.fromtimestamp(record.created, tz=UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")
        )
        log_record["level"] = record.levelname
        log_record["logger"] = record.name
        if "msg" not in log_record:
            log_record["msg"] = record.getMessage()
        if "event" not in log_record:
            log_record["event"] = record.getMessage()
        # Error details
        if record.exc_info:
            exc_type, exc_val, _ = record.exc_info
            log_record["error.type"] = exc_type.__name__ if exc_type else None
            log_record["error.message"] = str(exc_val) if exc_val else None
            # Stack trace is filled by base class as ``exc_info`` string.
        log_record.pop("message", None)
        log_record.pop("taskName", None)


# ─── Public API ────────────────────────────────────────────────────────────

logger = logging.getLogger("app")


def configure_logging(settings) -> None:
    """Apply the structured-logging dictConfig.

    Safe to call multiple times — subsequent calls replace handlers.
    Emits to ``sys.stdout`` only (Docker streams that to the log driver).
    """
    json_format = (
        "%(ts)s %(level)s %(logger)s %(msg)s %(request_id)s %(user_id)s "
        "%(ip)s %(method)s %(path)s %(status)s %(duration_ms)s %(event)s"
    )
    text_format = "%(asctime)s | %(levelname)-8s | %(name)s | rid=%(request_id)s uid=%(user_id)s | %(message)s"

    config: dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {
            "context": {
                "()": ContextFilter,
                "service": settings.LOG_SERVICE_NAME,
                "env": settings.ENV,
                "version": settings.LOG_VERSION,
            },
            "redact": {"()": RedactFilter},
        },
        "formatters": {
            "json": {
                "()": _JsonFormatter,
                "format": json_format,
            },
            "text": {
                "format": text_format,
                "datefmt": "%Y-%m-%dT%H:%M:%S",
            },
        },
        "handlers": {
            "stdout": {
                "class": "logging.StreamHandler",
                "stream": sys.stdout,
                "formatter": settings.LOG_FORMAT,
                "filters": ["context", "redact"],
            },
        },
        "loggers": {
            "app": {
                "handlers": ["stdout"],
                "level": settings.LOG_LEVEL,
                "propagate": False,
            },
            "uvicorn": {
                "handlers": ["stdout"],
                "level": settings.LOG_LEVEL,
                "propagate": False,
            },
            "uvicorn.error": {
                "handlers": ["stdout"],
                "level": settings.LOG_LEVEL,
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["stdout"],
                "level": "WARNING",  # own middleware already logs requests
                "propagate": False,
            },
            "sqlalchemy.engine": {
                "handlers": ["stdout"],
                "level": "WARNING",
                "propagate": False,
            },
        },
        "root": {
            "handlers": ["stdout"],
            "level": settings.LOG_LEVEL,
        },
    }

    logging.config.dictConfig(config)

    # Sentry (optional)
    if settings.SENTRY_DSN:
        try:
            import sentry_sdk
            from sentry_sdk.integrations.fastapi import FastApiIntegration
            from sentry_sdk.integrations.logging import LoggingIntegration

            sentry_sdk.init(
                dsn=settings.SENTRY_DSN,
                environment=settings.ENV,
                release=settings.LOG_VERSION,
                integrations=[
                    FastApiIntegration(),
                    LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
                ],
                before_send=_sentry_before_send,
                send_default_pii=False,
            )
            logger.info("sentry.initialised", extra={"event": "sentry.initialised"})
        except ImportError:  # pragma: no cover - optional dep
            logger.warning(
                "sentry.sdk_missing",
                extra={
                    "event": "sentry.sdk_missing",
                    "hint": "pip install sentry-sdk[fastapi]",
                },
            )


def _sentry_before_send(event: dict, _hint: dict) -> dict:  # pragma: no cover
    """Run Sentry events through the same redaction pipeline used for logs."""
    return _redact(event)  # type: ignore[return-value]
