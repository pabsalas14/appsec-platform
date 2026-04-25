"""BRD A4: comprobación mínima de coherencia de la cadena organizativa en API."""

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_org_hierarchy


@pytest.mark.asyncio
async def test_brd_a4_subdireccion_gerencia_organizacion_cadena(client: AsyncClient, auth_headers: dict):
    h = await create_org_hierarchy(client, auth_headers)
    o = await client.get(f"/api/v1/organizacions/{h['organizacion_id']}", headers=auth_headers)
    assert o.status_code == 200, o.text
    body = o.json()["data"]
    assert body["gerencia_id"] == h["gerencia_id"]
    g = await client.get(f"/api/v1/gerencias/{h['gerencia_id']}", headers=auth_headers)
    assert g.status_code == 200, g.text
    gbody = g.json()["data"]
    assert gbody["subdireccion_id"] == h["subdireccion_id"]
