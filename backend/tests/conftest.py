"""
Shared test fixtures for the framework backend.

Strategy
--------
asyncpg connections are strictly bound to the event loop that created them,
and ``pytest-asyncio`` (in ``auto`` mode) allocates a fresh event loop per
test by default. Reusing pooled connections across loops triggers
``asyncpg`` errors like ``cannot perform operation: another operation is in
progress``.

To avoid that entirely we:

1. Create the test engine inside a session-scoped async fixture (so it is
   bound to a running loop, not import time).
2. Use ``NullPool`` so every ``AsyncSession`` checkout opens a *fresh*
   asyncpg connection on the current loop and disposes it on release.
3. Override the app's ``get_db`` dependency to use the test session
   factory, and ``TRUNCATE`` user data after each test for isolation.

Tables are created by Alembic on container start; we never re-create schema
here.
"""

import asyncio
import uuid
from collections.abc import AsyncGenerator, Generator
from pathlib import Path

import asyncpg.exceptions
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient, Response
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.config import settings
from app.core.rate_limit import (
    clear_auth_login_rate_window_for_username,
    clear_login_failures,
    reset_rate_limit_state,
)
from app.database import get_db
from app.main import app

# ``auth._login_limit_key`` usa ``{request.client.host}:{username}``. Según el
# transport (ASGI directo vs proxy / Docker), el host puede ser ``127.0.0.1``,
# ``testclient``, etc. Limpiamos todas las variantes habituales para tests.
_LOGIN_LOCKOUT_HOST_CANDIDATES = ("127.0.0.1", "testclient", "localhost")


def _clear_login_lockout_for_username(username: str) -> None:
    u = username.lower()
    for host in _LOGIN_LOCKOUT_HOST_CANDIDATES:
        clear_login_failures(f"{host}:{u}")


# ─── Engine & session factory (session-scoped, loop-safe) ────────────────────


def _assert_test_database() -> None:
    """Refuse to run if DATABASE_URL looks like a shared dev/prod DB.

    Tests TRUNCATE ``users``, ``tasks`` and ``refresh_tokens`` after every
    test. A mis-pointed ``DATABASE_URL`` would nuke real data. We require
    the URL to opt in via a ``_test`` suffix on the DB name, unless
    ``PYTEST_ALLOW_ANY_DB=1`` (used only by CI with an ephemeral service).
    """
    import os

    if os.environ.get("PYTEST_ALLOW_ANY_DB") == "1":
        return

    db_name = settings.DATABASE_URL.rsplit("/", 1)[-1].split("?", 1)[0]
    if not db_name.endswith("_test"):
        raise RuntimeError(
            "Refusing to run pytest against a non-test database "
            f"(got DB={db_name!r}). Set DATABASE_URL to a *_test DB or "
            "export PYTEST_ALLOW_ANY_DB=1 (CI-only escape hatch)."
        )


_assert_test_database()

_RUNTIME_SKIP_ALLOWLIST = {
    # Performance smoke tests are opt-in and may legitimately skip.
    "test_phase_h_import_perf.py",
}


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Use a single loop for the full test session.

    Session-scoped async fixtures (engine/session factory) and asyncpg connections
    must stay on the same loop to avoid cross-loop RuntimeError in CI.
    """
    loop = asyncio.new_event_loop()
    try:
        yield loop
    finally:
        loop.close()


@pytest.fixture(autouse=True)
def _forbid_runtime_pytest_skip(
    monkeypatch: pytest.MonkeyPatch,
    request: pytest.FixtureRequest,
) -> None:
    """Block runtime ``pytest.skip()`` so test failures cannot be hidden."""
    test_file = Path(str(request.node.fspath)).name
    if test_file in _RUNTIME_SKIP_ALLOWLIST:
        return

    def _fail_skip(reason: str | None = None, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
        message = reason or "Runtime pytest.skip() is disabled in this test suite."
        pytest.fail(
            f"Illegal runtime pytest.skip() in {test_file}: {message}",
            pytrace=False,
        )

    monkeypatch.setattr(pytest, "skip", _fail_skip)


def _is_pg_deadlock(exc: BaseException) -> bool:
    cur: BaseException | None = exc
    for _ in range(8):
        if cur is None:
            return False
        if isinstance(cur, asyncpg.exceptions.DeadlockDetectedError):
            return True
        cur = getattr(cur, "__cause__", None) or getattr(cur, "orig", None)  # type: ignore[assignment]
    return False


async def _truncate_test_data_after_test(engine: AsyncEngine) -> None:
    """Clear rows after each test; retry on PostgreSQL deadlocks (TRUNCATE vs app TX)."""
    truncate_sql = (
        "TRUNCATE TABLE audit_logs, refresh_tokens, attachments, "
        "role_permissions, roles, permissions, system_settings, "
        "tasks, projects, "
        "changelog_entradas, "
        "regla_sods, "
        "control_seguridads, tipo_pruebas, "
        "aplicacion_movils, servicios, "
        "hallazgo_sasts, actividad_mensual_sasts, programa_sasts, "
        "hallazgo_pipelines, pipeline_releases, "
        "revision_source_codes, programa_source_codes, "
        "repositorios, activo_webs, "
        "celulas, gerencias, subdireccions, organizacions, "
        "users CASCADE"
    )
    truncate_stmt = text(truncate_sql)

    for attempt in range(12):
        try:
            async with engine.begin() as conn:
                await conn.execute(truncate_stmt)
            return
        except DBAPIError as exc:
            if _is_pg_deadlock(exc):
                await asyncio.sleep(0.08 * (attempt + 1))
                continue
            raise


@pytest_asyncio.fixture(scope="session")
async def _engine() -> AsyncGenerator[AsyncEngine, None]:
    """Session-scoped async engine with NullPool for loop affinity safety."""
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )
    try:
        yield engine
    finally:
        await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def _session_factory(
    _engine: AsyncEngine,
) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session")
async def session_factory(
    _session_factory: async_sessionmaker[AsyncSession],
) -> async_sessionmaker[AsyncSession]:
    """Alias for ``_session_factory`` (compat con tests que piden ``session_factory``)."""
    return _session_factory


@pytest_asyncio.fixture
async def async_db(
    _session_factory: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[AsyncSession, None]:
    """Sesión de lectura/escritura para tests que no pasan por el cliente HTTP."""
    async with _session_factory() as session:
        yield session


# ─── DB dependency override + per-test data cleanup ──────────────────────────


@pytest_asyncio.fixture(autouse=True)
async def _apply_db_override(
    _engine: AsyncEngine,
    _session_factory: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[None, None]:
    """Override ``get_db`` for every test, truncate user data after each test."""

    async def _test_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with _session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = _test_get_db
    reset_rate_limit_state()
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_db, None)
        reset_rate_limit_state()
        await _truncate_test_data_after_test(_engine)


# ─── HTTP client & auth helpers ──────────────────────────────────────────────


class _DrainingAsyncClient(AsyncClient):
    """Consume response bodies so ASGI puede finalizar el scope y ejecutar
    el código tras ``yield`` en ``get_db`` (commit) antes del siguiente request.

    Con ``httpx.ASGITransport``, si no se lee el body, el teardown de
    dependencias queda diferido; register→login en la misma prueba veía
    todavía 401 (usuario no confirmado en BD).
    """

    async def request(self, *args, **kwargs) -> Response:  # type: ignore[no-untyped-def]
        r = await super().request(*args, **kwargs)
        ct = (r.headers.get("content-type") or "").lower()
        if "text/event-stream" in ct:
            return r
        await r.aread()
        # ASGITransport puede entregar el cuerpo antes de que FastAPI ejecute el
        # teardown de Depends (commit tras ``yield`` en get_db). Sin ceder el
        # loop, register→login en el mismo cliente ve 401 intermitente.
        for _ in range(20):
            await asyncio.sleep(0)
        return r


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async httpx client wired to the FastAPI app via ASGI transport."""
    transport = ASGITransport(app=app)
    async with _DrainingAsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def _csrf_headers(client: AsyncClient) -> dict[str, str]:
    token = client.cookies.get("csrf_token")
    assert token, "Missing csrf_token cookie after login"
    return {"X-CSRF-Token": token}


async def _register_and_login(client: AsyncClient, username: str | None = None) -> None:
    """Helper: register + login a disposable user into the client cookie jar."""
    unique = uuid.uuid4().hex[:8]
    username = username or f"testuser_{unique}"
    payload = {
        "username": username,
        "email": f"{username}@example.com",
        "password": "Testpass123",
    }

    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, f"Register failed: {resp.text}"
    await asyncio.sleep(0.18)

    login_payload = {"username": payload["username"], "password": payload["password"]}
    # Evita que reintentos por 401 transitorio acumulen lockout (429).
    _clear_login_lockout_for_username(login_payload["username"])
    last_login_resp: Response | None = None
    for attempt in range(10):
        resp = await client.post("/api/v1/auth/login", json=login_payload)
        last_login_resp = resp
        if resp.status_code == 200:
            break
        if resp.status_code == 401:
            _clear_login_lockout_for_username(login_payload["username"])
        elif resp.status_code == 429:
            _clear_login_lockout_for_username(login_payload["username"])
            clear_auth_login_rate_window_for_username(login_payload["username"])
        # get_db() commits after dependency teardown; under load it can lag briefly.
        await asyncio.sleep(0.06 * (attempt + 1))

    assert last_login_resp is not None
    assert last_login_resp.status_code == 200, f"Login failed: {last_login_resp.text}"
    await asyncio.sleep(0.08)


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient) -> AsyncClient:
    """Register/login a test user and return the cookie-authenticated client."""
    await _register_and_login(client)
    return client


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    """Register/login a test user and return Bearer headers from the auth cookie."""
    await _register_and_login(client)
    token = client.cookies.get("access_token")
    assert token, "Missing access_token cookie after login"
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def auth_csrf_headers(auth_client: AsyncClient) -> dict[str, str]:
    """Headers required for mutating requests authenticated via cookies."""
    return _csrf_headers(auth_client)


@pytest_asyncio.fixture
async def other_auth_headers(client: AsyncClient) -> dict[str, str]:
    """Second, independent authenticated user — used for IDOR/ownership tests."""
    await _register_and_login(client)
    token = client.cookies.get("access_token")
    assert token, "Missing access_token cookie after login"
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def admin_auth_headers(
    client: AsyncClient,
    _session_factory: async_sessionmaker[AsyncSession],
) -> dict[str, str]:
    """Register a user and promote them to ``admin`` role, return Bearer headers."""
    unique = uuid.uuid4().hex[:8]
    username = f"admin_{unique}"
    payload = {
        "username": username,
        "email": f"{username}@example.com",
        "password": "Adminpass123",
    }

    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    await asyncio.sleep(0.05)

    async with _session_factory() as session:
        await session.execute(
            text("UPDATE users SET role = 'admin' WHERE username = :u"),
            {"u": username},
        )
        await session.commit()

    await asyncio.sleep(0.02)

    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": payload["password"]},
    )
    assert resp.status_code == 200, resp.text
    token = client.cookies.get("access_token")
    assert token, "Missing access_token cookie after admin login"
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def super_admin_auth_headers(
    client: AsyncClient,
    _session_factory: async_sessionmaker[AsyncSession],
) -> dict[str, str]:
    """Register a user, promote to ``super_admin``, return Bearer headers."""
    unique = uuid.uuid4().hex[:8]
    username = f"superadmin_{unique}"
    payload = {
        "username": username,
        "email": f"{username}@example.com",
        "password": "Adminpass123",
    }

    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    await asyncio.sleep(0.05)

    async with _session_factory() as session:
        await session.execute(
            text("UPDATE users SET role = 'super_admin' WHERE username = :u"),
            {"u": username},
        )
        await session.commit()

    await asyncio.sleep(0.02)

    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": payload["password"]},
    )
    assert resp.status_code == 200, resp.text
    token = client.cookies.get("access_token")
    assert token, "Missing access_token cookie after super_admin login"
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def readonly_auth_headers(
    client: AsyncClient,
    _session_factory: async_sessionmaker[AsyncSession],
) -> dict[str, str]:
    """Register a user, promote to ``readonly`` (sin permisos de mutación de catálogo)."""
    unique = uuid.uuid4().hex[:8]
    username = f"readonly_{unique}"
    payload = {
        "username": username,
        "email": f"{username}@example.com",
        "password": "Testpass123",
    }

    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    await asyncio.sleep(0.05)

    async with _session_factory() as session:
        await session.execute(
            text("UPDATE users SET role = 'readonly' WHERE username = :u"),
            {"u": username},
        )
        await session.commit()

    await asyncio.sleep(0.02)

    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": payload["password"]},
    )
    assert resp.status_code == 200, resp.text
    token = client.cookies.get("access_token")
    assert token, "Missing access_token cookie after readonly login"
    return {"Authorization": f"Bearer {token}"}
