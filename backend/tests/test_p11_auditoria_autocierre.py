"""P11: cierre de auditoría cuando todos los hallazgos están en estatus de cumplimiento."""

import pytest
from httpx import AsyncClient

AUD = "/api/v1/auditorias"
HALL = "/api/v1/hallazgo_auditorias"


@pytest.mark.asyncio
async def test_auditoria_se_autocierre_cuando_todos_los_hallazgos_cumplidos(
    client: AsyncClient, auth_headers: dict[str, str]
):
    r = await client.post(
        AUD,
        headers=auth_headers,
        json={
            "titulo": "Aud test P11",
            "tipo": "Interna",
            "alcance": "Scope",
            "fecha_inicio": "2025-01-15T00:00:00+00:00",
            "fecha_fin": "2025-12-15T00:00:00+00:00",
            "estado": "En curso",
        },
    )
    assert r.status_code == 201, r.text
    aid = r.json()["data"]["id"]
    h1 = await client.post(
        HALL,
        headers=auth_headers,
        json={
            "auditoria_id": aid,
            "titulo": "Req1",
            "descripcion": "D",
            "severidad": "Alta",
            "categoria": "G",
            "estado": "Pendiente",
        },
    )
    assert h1.status_code == 201, h1.text
    hid1 = h1.json()["data"]["id"]
    p = await client.patch(
        f"{HALL}/{hid1}",
        headers=auth_headers,
        json={"estado": "Completado"},
    )
    assert p.status_code == 200, p.text
    g = await client.get(f"{AUD}/{aid}", headers=auth_headers)
    assert g.status_code == 200, g.text
    assert g.json()["data"]["estado"] == "Completada"
