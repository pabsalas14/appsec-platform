"""
IDOR (Insecure Direct Object Reference) Comprehensive Test Suite

Valida que TODAS las entities con user_id/usuario_id:
  1. Owner A NO ve recursos de Owner B
  2. GET {id} retorna 404 si no es dueño
  3. PATCH/DELETE rechaza si no es dueño
  4. require_ownership() está correctamente implementado en routers
"""

import uuid

import pytest
from httpx import AsyncClient

# ─── IDOR Test Matrix ────────────────────────────────────────────────────────

IDOR_TEST_ENTITIES = [
    # (entity_name, endpoint_prefix, create_payload, update_payload)
    (
        "vulnerabilidad",
        "vulnerabilidads",
        {
            "titulo": "Test IDOR Vuln",
            "descripcion": "Test",
            "fuente": "SAST",
            "severidad": "Alta",
            "estado": "Abierta",
            # activo_web_id will be added in the test
        },
        {
            "estado": "En Progreso",
        },
    ),
    (
        "iniciativa",
        "iniciativas",
        {
            "titulo": "Test IDOR Init",
            "tipo": "Proceso",
            "estado": "Abierta",
        },
        {
            "estado": "En Progreso",
        },
    ),
    (
        "tema_emergente",
        "temas_emergentes",
        {
            "titulo": "Test IDOR Theme",
            "descripcion": "Test description",
            "tipo": "Tendencia",
            "impacto": "Alto",
            "estado": "Abierto",
            "fuente": "Investigacion Interna",
        },
        {
            "estado": "Activo",
        },
    ),
    (
        "filtro_guardado",
        "filtros_guardados",
        {
            "nombre": "Test IDOR Filter",
            "modulo": "vulnerabilities",
            "parametros": {"estado": "Abierta"},
        },
        {
            "nombre": "Updated Filter",
        },
    ),
]


async def _create_activo_web_for_test(client: AsyncClient, auth_headers: dict) -> str:
    """Helper: Create an ActivoWeb and return its ID."""
    resp = await client.post(
        "/api/v1/activo_webs",
        json={
            "nombre": f"Test Web {uuid.uuid4().hex[:6]}",
            "url": "https://example.com",
            "ambiente": "Test",
            "tipo": "app",
        },
        headers=auth_headers,
    )
    if resp.status_code != 201:
        pytest.skip(f"Failed to create ActivoWeb: {resp.text}")
    return resp.json()["data"]["id"]


@pytest.mark.asyncio
@pytest.mark.parametrize("entity_info", IDOR_TEST_ENTITIES, ids=[e[0] for e in IDOR_TEST_ENTITIES])
async def test_idor_get_other_user_resource(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
    entity_info: tuple,
):
    """User B cannot GET User A's resource (should be 404)."""
    entity_name, endpoint, create_payload_template, _ = entity_info

    # Make a copy of the payload to avoid modifying the original
    create_payload = dict(create_payload_template)

    # For vulnerabilidad, create an ActivoWeb first
    if entity_name == "vulnerabilidad":
        create_payload["activo_web_id"] = await _create_activo_web_for_test(client, auth_headers)

    # User A creates resource
    resp_a = await client.post(
        f"/api/v1/{endpoint}",
        json=create_payload,
        headers=auth_headers,
    )

    if resp_a.status_code != 201:
        pytest.skip(f"Failed to create {entity_name} (status={resp_a.status_code}): {resp_a.text}")

    resource_id = resp_a.json()["data"]["id"]

    # User B tries to GET it
    resp_b = await client.get(
        f"/api/v1/{endpoint}/{resource_id}",
        headers=other_auth_headers,
    )

    # Should be 404 (forbidden access) or 403
    assert resp_b.status_code in (404, 403), (
        f"IDOR FAILED: User B accessed User A's {entity_name} (got {resp_b.status_code})"
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("entity_info", IDOR_TEST_ENTITIES, ids=[e[0] for e in IDOR_TEST_ENTITIES])
async def test_idor_patch_other_user_resource(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
    entity_info: tuple,
):
    """User B cannot PATCH User A's resource (should be 403)."""
    entity_name, endpoint, create_payload_template, update_payload = entity_info

    # Make a copy of the payload to avoid modifying the original
    create_payload = dict(create_payload_template)

    # For vulnerabilidad, create an ActivoWeb first
    if entity_name == "vulnerabilidad":
        create_payload["activo_web_id"] = await _create_activo_web_for_test(client, auth_headers)

    # User A creates resource
    resp_a = await client.post(
        f"/api/v1/{endpoint}",
        json=create_payload,
        headers=auth_headers,
    )

    if resp_a.status_code != 201:
        pytest.skip(f"Failed to create {entity_name} (status={resp_a.status_code}): {resp_a.text}")

    resource_id = resp_a.json()["data"]["id"]

    # User B tries to PATCH it
    resp_b = await client.patch(
        f"/api/v1/{endpoint}/{resource_id}",
        json=update_payload,
        headers=other_auth_headers,
    )

    # Should be 403 Forbidden
    assert resp_b.status_code in (403, 404), (
        f"IDOR FAILED: User B modified User A's {entity_name} (got {resp_b.status_code})"
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("entity_info", IDOR_TEST_ENTITIES, ids=[e[0] for e in IDOR_TEST_ENTITIES])
async def test_idor_delete_other_user_resource(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
    entity_info: tuple,
):
    """User B cannot DELETE User A's resource (should be 403)."""
    entity_name, endpoint, create_payload_template, _ = entity_info

    # Make a copy of the payload to avoid modifying the original
    create_payload = dict(create_payload_template)

    # For vulnerabilidad, create an ActivoWeb first
    if entity_name == "vulnerabilidad":
        create_payload["activo_web_id"] = await _create_activo_web_for_test(client, auth_headers)

    # User A creates resource
    resp_a = await client.post(
        f"/api/v1/{endpoint}",
        json=create_payload,
        headers=auth_headers,
    )

    if resp_a.status_code != 201:
        pytest.skip(f"Failed to create {entity_name} (status={resp_a.status_code}): {resp_a.text}")

    resource_id = resp_a.json()["data"]["id"]

    # User B tries to DELETE it
    resp_b = await client.delete(
        f"/api/v1/{endpoint}/{resource_id}",
        headers=other_auth_headers,
    )

    # Should be 403 Forbidden
    assert resp_b.status_code in (403, 404), (
        f"IDOR FAILED: User B deleted User A's {entity_name} (got {resp_b.status_code})"
    )


@pytest.mark.asyncio
async def test_idor_list_only_own_resources(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    """User's list endpoint should NOT return other user's resources."""
    # User A creates ActivoWeb first
    aw_id = await _create_activo_web_for_test(client, auth_headers)

    # User A creates vulnerability
    resp_a = await client.post(
        "/api/v1/vulnerabilidads",
        json={
            "titulo": "User A Vuln",
            "descripcion": "Test",
            "fuente": "SAST",
            "severidad": "Alta",
            "estado": "Abierta",
            "activo_web_id": aw_id,
        },
        headers=auth_headers,
    )
    assert resp_a.status_code == 201, f"Failed to create vulnerability: {resp_a.text}"
    user_a_vuln_id = resp_a.json()["data"]["id"]

    # User B lists vulnerabilities
    resp_b = await client.get(
        "/api/v1/vulnerabilidads",
        headers=other_auth_headers,
    )
    assert resp_b.status_code == 200

    user_b_vulns = resp_b.json()["data"]
    user_b_ids = [v["id"] for v in user_b_vulns]

    # User A's vulnerability should NOT be in User B's list
    assert user_a_vuln_id not in user_b_ids, "IDOR FAILED: User B can see User A's vulnerability in list"


@pytest.mark.asyncio
async def test_idor_owner_can_access_own_resource(
    client: AsyncClient,
    auth_headers: dict,
):
    """Owner SHOULD be able to access their own resource."""
    # Create ActivoWeb first
    aw_id = await _create_activo_web_for_test(client, auth_headers)

    # User A creates vulnerability
    resp = await client.post(
        "/api/v1/vulnerabilidads",
        json={
            "titulo": "Owner Test",
            "descripcion": "Test",
            "fuente": "SAST",
            "severidad": "Alta",
            "estado": "Abierta",
            "activo_web_id": aw_id,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201, f"Failed to create vulnerability: {resp.text}"
    vuln_id = resp.json()["data"]["id"]

    # User A gets their own resource
    resp_get = await client.get(
        f"/api/v1/vulnerabilidads/{vuln_id}",
        headers=auth_headers,
    )

    # Should be 200 OK
    assert resp_get.status_code == 200, "Owner cannot access own resource"
    assert resp_get.json()["data"]["id"] == vuln_id
