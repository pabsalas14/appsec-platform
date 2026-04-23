"""
Framework API — application entry point.

Configures FastAPI, mounts routers, installs the structured logging
pipeline, and wires global exception handlers that respect the response
envelope contract (ADR-0001).
"""

import random
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.v1.router import api_router
from app.core.csrf import csrf_is_valid, request_needs_csrf
from app.core.logging import configure_logging, logger
from app.core.logging_context import bind as bind_ctx, clear as clear_ctx
from app.core.response import error as error_response

# ─── Structured logging (dictConfig) ──────────────────────────────────────────
configure_logging(settings)


# ─── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "app.startup",
        extra={
            "event": "app.startup",
            "env": settings.ENV,
            "log_format": settings.LOG_FORMAT,
            "log_level": settings.LOG_LEVEL,
        },
    )
    yield
    logger.info("app.shutdown", extra={"event": "app.shutdown"})


# ─── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Framework API",
    description="Generic development framework — starter kit for fullstack projects",
    version="1.0.0",
    docs_url="/docs" if settings.ENABLE_OPENAPI_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_OPENAPI_DOCS else None,
    openapi_url="/openapi.json" if settings.ENABLE_OPENAPI_DOCS else None,
    lifespan=lifespan,
    redirect_slashes=False,
)

app.include_router(api_router)


# ─── Global exception handlers ─────────────────────────────────────────────────
# Every response — success OR error — follows the envelope shape described in
# docs/adr/0001-api-contract.md.


@app.exception_handler(HTTPException)
async def _http_exception_handler(request: Request, exc: HTTPException):
    """Render HTTPException (NotFound, Unauthorized, …) as envelope."""
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            str(exc.detail) if exc.detail is not None else "",
            code=type(exc).__name__,
        ),
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def _validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    """Render Pydantic/FastAPI request validation errors as 422 envelope."""
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "detail": jsonable_encoder(exc.errors()),
            "code": "RequestValidationError",
        },
    )


@app.exception_handler(Exception)
async def _global_exception_handler(request: Request, exc: Exception):
    """Fallback for unhandled exceptions — always 500 with envelope."""
    logger.error(
        "http.exception",
        extra={
            "event": "http.exception",
            "method": request.method,
            "path": request.url.path,
        },
        exc_info=True,
    )

    if settings.ENABLE_OPENAPI_DOCS:
        return JSONResponse(
            status_code=500,
            content=error_response(str(exc), code=type(exc).__name__),
        )

    return JSONResponse(
        status_code=500,
        content=error_response("Internal server error"),
    )


# ─── Request logging middleware ────────────────────────────────────────────────


_HEALTH_PATHS = {"/api/health"}


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Bind per-request context + emit structured http.request/http.response.

    - Reads (or generates) ``X-Request-ID`` and echoes it on the response so
      frontends can correlate their own logs with backend records.
    - Binds ``request_id``, ``method``, ``path``, ``ip``, ``user_agent`` to
      contextvars so every ``logger.*`` call inside the request is enriched.
    - Samples ``/api/health`` via ``LOG_SAMPLE_HEALTH`` (0.0 → skip).
    """
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    client_ip = request.client.host if request.client else None

    clear_ctx()
    bind_ctx(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        ip=client_ip,
        user_agent=request.headers.get("user-agent"),
    )

    skip_log = (
        request.url.path in _HEALTH_PATHS
        and random.random() >= settings.LOG_SAMPLE_HEALTH
    )

    if not skip_log:
        logger.info(
            "http.request",
            extra={"event": "http.request"},
        )

    if request_needs_csrf(request) and not csrf_is_valid(request):
        logger.warning(
            "security.csrf_rejected",
            extra={
                "event": "security.csrf_rejected",
                "status": 403,
            },
        )
        clear_ctx()
        return JSONResponse(
            status_code=403,
            content=error_response(
                "CSRF token missing or invalid",
                code="ForbiddenException",
            ),
        )

    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (time.perf_counter() - start) * 1000
        logger.exception(
            "http.response",
            extra={
                "event": "http.response",
                "status": 500,
                "duration_ms": round(duration_ms, 2),
            },
        )
        raise

    duration_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Request-ID"] = request_id

    if not skip_log:
        log_fn = logger.info if response.status_code < 500 else logger.error
        log_fn(
            "http.response",
            extra={
                "event": "http.response",
                "status": response.status_code,
                "duration_ms": round(duration_ms, 2),
            },
        )

    clear_ctx()
    return response


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Apply baseline security headers (OWASP API8)."""
    response = await call_next(request)
    if not settings.SECURITY_HEADERS_ENABLED:
        return response

    # Clickjacking + MIME sniffing
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault(
        "Referrer-Policy", "strict-origin-when-cross-origin"
    )

    # CSP: keep config-driven; can be tightened later per frontend needs.
    if settings.SECURITY_CSP:
        response.headers.setdefault("Content-Security-Policy", settings.SECURITY_CSP)

    # HSTS only in prod (needs HTTPS end-to-end)
    if settings.ENV == "prod":
        response.headers.setdefault(
            "Strict-Transport-Security",
            f"max-age={settings.SECURITY_HSTS_MAX_AGE_SECONDS}; includeSubDomains",
        )

    return response


# ─── Health check ──────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
