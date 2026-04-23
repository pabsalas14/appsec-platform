"""Smoke tests — health endpoint."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    """GET /api/health should return 200 with status ok."""
    resp = await client.get("/api/health")
    assert resp.status_code == 200

    data = resp.json()
    assert data["status"] == "ok"
    assert "version" in data

    # Baseline OWASP API8 headers
    assert resp.headers.get("x-frame-options") == "DENY"
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "content-security-policy" in resp.headers
