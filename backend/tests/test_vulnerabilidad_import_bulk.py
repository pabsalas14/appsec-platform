"""Importación masiva CSV — POST /vulnerabilidads/import/{motor}."""

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_repositorio_id


@pytest.mark.asyncio
async def test_import_bulk_sast_creates(client: AsyncClient, admin_auth_headers: dict) -> None:
    repo_id = await create_repositorio_id(client, admin_auth_headers)
    csv_body = f"""titulo,severidad,estado,repositorio_id
ImpBulk A,Alta,Abierta,{repo_id}
ImpBulk B,Media,Abierta,{repo_id}
"""
    r = await client.post(
        "/api/v1/vulnerabilidads/import/sast",
        headers=admin_auth_headers,
        files={"file": ("bulk.csv", csv_body.encode("utf-8"), "text/csv")},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "success"
    assert body["data"]["created"] == 2
    assert body["data"].get("skipped_duplicates", 0) == 0


@pytest.mark.asyncio
async def test_import_bulk_skips_duplicates(client: AsyncClient, admin_auth_headers: dict) -> None:
    repo_id = await create_repositorio_id(client, admin_auth_headers)
    title = "DupVulnTitleXYZ"
    csv_body = f"""titulo,severidad,estado,repositorio_id
{title},Alta,Abierta,{repo_id}
"""
    r1 = await client.post(
        "/api/v1/vulnerabilidads/import/dast",
        headers=admin_auth_headers,
        files={"file": ("d1.csv", csv_body.encode("utf-8"), "text/csv")},
    )
    assert r1.status_code == 200, r1.text
    assert r1.json()["data"]["created"] == 1

    r2 = await client.post(
        "/api/v1/vulnerabilidads/import/dast",
        headers=admin_auth_headers,
        files={"file": ("d2.csv", csv_body.encode("utf-8"), "text/csv")},
    )
    assert r2.status_code == 200, r2.text
    data = r2.json()["data"]
    assert data["created"] == 0
    assert data.get("skipped_duplicates", 0) == 1
