from __future__ import annotations

from httpx import AsyncClient

from tests.graph_helpers import create_org_hierarchy, create_repositorio_id


async def test_dashboard_accepts_extended_hierarchy_filters(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """
    New hierarchy order:
    direccion -> subdireccion -> gerencia -> organizacion -> celula -> repositorio.
    """
    h = await create_org_hierarchy(client, auth_headers)
    repo_id = await create_repositorio_id(client, auth_headers)

    resp = await client.get(
        "/api/v1/dashboard/executive",
        headers=auth_headers,
        params={
            "direccion_id": h["direccion_id"],
            "subdireccion_id": h["subdireccion_id"],
            "gerencia_id": h["gerencia_id"],
            "organizacion_id": h["organizacion_id"],
            "repositorio_id": repo_id,
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()["data"]
    applied = body.get("applied_filters", {})
    assert "direccion_id" in applied
    assert "subdireccion_id" in applied
    assert "gerencia_id" in applied
    assert "organizacion_id" in applied
    assert "repositorio_id" in applied
