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

    # Celula colgada de la organizacion creada en la misma cadena
    cel = await client.post(
        "/api/v1/celulas",
        headers=auth_headers,
        json={
            "nombre": "Cel A4",
            "tipo": "Dev",
            "descripcion": "test A4",
            "organizacion_id": h["organizacion_id"],
        },
    )
    assert cel.status_code == 201, cel.text
    cel_id = cel.json()["data"]["id"]

    # Entidades de inventario deben mantener la referencia a la celula correcta
    repo = await client.post(
        "/api/v1/repositorios",
        headers=auth_headers,
        json={
            "nombre": "Repo A4",
            "url": "https://github.com/example/repo-a4",
            "plataforma": "GitHub",
            "rama_default": "main",
            "celula_id": cel_id,
        },
    )
    assert repo.status_code == 201, repo.text
    repo_id = repo.json()["data"]["id"]
    repo_get = await client.get(f"/api/v1/repositorios/{repo_id}", headers=auth_headers)
    assert repo_get.status_code == 200, repo_get.text
    assert repo_get.json()["data"]["celula_id"] == cel_id

    aw = await client.post(
        "/api/v1/activo_webs",
        headers=auth_headers,
        json={
            "nombre": "Activo A4",
            "url": "https://app.example.com",
            "ambiente": "produccion",
            "tipo": "web",
            "celula_id": cel_id,
        },
    )
    assert aw.status_code == 201, aw.text
    aw_id = aw.json()["data"]["id"]
    aw_get = await client.get(f"/api/v1/activo_webs/{aw_id}", headers=auth_headers)
    assert aw_get.status_code == 200, aw_get.text
    assert aw_get.json()["data"]["celula_id"] == cel_id

    svc = await client.post(
        "/api/v1/servicios",
        headers=auth_headers,
        json={
            "nombre": "Servicio A4",
            "criticidad": "Alta",
            "descripcion": "test A4",
            "celula_id": cel_id,
        },
    )
    assert svc.status_code == 201, svc.text
    svc_id = svc.json()["data"]["id"]
    svc_get = await client.get(f"/api/v1/servicios/{svc_id}", headers=auth_headers)
    assert svc_get.status_code == 200, svc_get.text
    assert svc_get.json()["data"]["celula_id"] == cel_id
