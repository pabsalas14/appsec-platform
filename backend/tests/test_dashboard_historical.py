"""Tests for historical program comparison dashboard endpoint."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_historical_comparison_unauthenticated(client: AsyncClient):
    """Requires authentication."""
    r = await client.get("/api/v1/dashboard/programs/historical-comparison")
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_historical_comparison_defaults(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Returns last 3 years by default with all program types."""
    r = await client.get(
        "/api/v1/dashboard/programs/historical-comparison",
        headers=admin_auth_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "success"
    data = body["data"]
    assert "years" in data
    assert "comparison" in data
    assert len(data["years"]) == 3


@pytest.mark.asyncio
async def test_historical_comparison_specific_years(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Accepts specific years parameter."""
    r = await client.get(
        "/api/v1/dashboard/programs/historical-comparison",
        params={"years": "2023,2024,2025"},
        headers=admin_auth_headers,
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert 2023 in data["years"]
    assert 2024 in data["years"]
    assert 2025 in data["years"]


@pytest.mark.asyncio
async def test_historical_comparison_sast_only(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Filters by program type SAST."""
    r = await client.get(
        "/api/v1/dashboard/programs/historical-comparison",
        params={"program_type": "sast"},
        headers=admin_auth_headers,
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert "SAST" in data["comparison"]
    assert "DAST" not in data["comparison"]


@pytest.mark.asyncio
async def test_historical_comparison_dast_only(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Filters by program type DAST."""
    r = await client.get(
        "/api/v1/dashboard/programs/historical-comparison",
        params={"program_type": "dast"},
        headers=admin_auth_headers,
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert "DAST" in data["comparison"]
    assert "SAST" not in data["comparison"]


@pytest.mark.asyncio
async def test_historical_comparison_all_types(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Returns all 4 program types when program_type=all."""
    r = await client.get(
        "/api/v1/dashboard/programs/historical-comparison",
        params={"program_type": "all"},
        headers=admin_auth_headers,
    )
    assert r.status_code == 200
    comparison = r.json()["data"]["comparison"]
    for expected_type in ("SAST", "DAST", "Source Code", "Threat Modeling"):
        assert expected_type in comparison


@pytest.mark.asyncio
async def test_historical_comparison_invalid_years(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Invalid years parameter returns 422."""
    r = await client.get(
        "/api/v1/dashboard/programs/historical-comparison",
        params={"years": "not,a,year"},
        headers=admin_auth_headers,
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_historical_comparison_invalid_program_type(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Invalid program_type returns 422."""
    r = await client.get(
        "/api/v1/dashboard/programs/historical-comparison",
        params={"program_type": "unknown_type"},
        headers=admin_auth_headers,
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_historical_comparison_response_structure(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Each year entry has expected fields."""
    r = await client.get(
        "/api/v1/dashboard/programs/historical-comparison",
        params={"years": "2025", "program_type": "sast"},
        headers=admin_auth_headers,
    )
    assert r.status_code == 200
    year_entries = r.json()["data"]["comparison"].get("SAST", [])
    if year_entries:
        entry = year_entries[0]
        assert "year" in entry
        assert "total" in entry
        assert "completion_rate" in entry
        assert "by_estado" in entry


@pytest.mark.asyncio
async def test_historical_comparison_max_5_years(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Truncates to last 5 years when more requested."""
    r = await client.get(
        "/api/v1/dashboard/programs/historical-comparison",
        params={"years": "2018,2019,2020,2021,2022,2023,2024,2025"},
        headers=admin_auth_headers,
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert len(data["years"]) <= 5
