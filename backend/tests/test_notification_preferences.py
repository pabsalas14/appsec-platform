"""GET/PATCH preferencias de notificaciones in-app (`/notificacions/preferences/me`)."""

import pytest
from httpx import AsyncClient

BASE = "/api/v1/notificacions/preferences/me"


@pytest.mark.asyncio
async def test_get_notification_preferences_me_requires_auth(client: AsyncClient):
    r = await client.get(BASE)
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_get_notification_preferences_me_defaults(client: AsyncClient, auth_headers: dict):
    r = await client.get(BASE, headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "success"
    d = body["data"]
    assert d["notificaciones_automaticas"] is True
    assert d["sla_vulnerabilidad"] is True
    assert d["auditoria_estado"] is True
    assert d["iniciativa_fecha_fin_vencida"] is True
    assert d["plan_remediacion_fecha_limite_vencida"] is True


@pytest.mark.asyncio
async def test_patch_notification_preferences_me(client: AsyncClient, auth_headers: dict):
    r = await client.patch(
        BASE,
        headers=auth_headers,
        json={"sla_vulnerabilidad": False, "auditoria_estado": False},
    )
    assert r.status_code == 200, r.text
    d = r.json()["data"]
    assert d["sla_vulnerabilidad"] is False
    assert d["auditoria_estado"] is False
    assert d["tema_estancado"] is True

    r2 = await client.get(BASE, headers=auth_headers)
    assert r2.json()["data"]["sla_vulnerabilidad"] is False
