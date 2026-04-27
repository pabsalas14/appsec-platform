"""Tests for EvidenciaAuditoria — audit evidence files."""

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/evidencia_auditorias"

SAMPLE = {
    "descripcion": "Vulnerability scan report",
    "tipo": "reporte",
    "archivo_nombre": "scan_report_2024.pdf",
    "archivo_tamanio": 1024000,
    "hash_sha256": "abcd1234efgh5678ijkl9012mnop3456qrst5678uvwx9012yz" + "ab" * 3,
}


@pytest.mark.asyncio
async def test_create_evidencia_auditoria(client: AsyncClient, auth_headers: dict):
    """Test creating audit evidence."""
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["tipo"] == "reporte"


@pytest.mark.asyncio
async def test_list_evidencias_auditoria(client: AsyncClient, auth_headers: dict):
    """Test listing audit evidence."""
    await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


@pytest.mark.asyncio
async def test_get_evidencia_auditoria(client: AsyncClient, auth_headers: dict):
    """Test getting specific audit evidence."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    evidencia_id = create_resp.json()["data"]["id"]

    resp = await client.get(f"{BASE_URL}/{evidencia_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == evidencia_id


@pytest.mark.asyncio
async def test_update_evidencia_auditoria(client: AsyncClient, auth_headers: dict):
    """Test updating audit evidence."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    evidencia_id = create_resp.json()["data"]["id"]

    update_payload = {
        "descripcion": "Updated evidence description",
        "tipo": "certificado",
    }
    resp = await client.patch(f"{BASE_URL}/{evidencia_id}", headers=auth_headers, json=update_payload)
    assert resp.status_code == 200
    assert resp.json()["data"]["tipo"] == "certificado"


@pytest.mark.asyncio
async def test_delete_evidencia_auditoria(client: AsyncClient, auth_headers: dict):
    """Test deleting audit evidence (soft delete)."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    evidencia_id = create_resp.json()["data"]["id"]

    resp = await client.delete(f"{BASE_URL}/{evidencia_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.get(f"{BASE_URL}/{evidencia_id}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_tipo_values(client: AsyncClient, auth_headers: dict):
    """Test different tipo values."""
    tipos = ["reporte", "certificado", "log", "screenshot", "email", "otro"]
    for tipo in tipos:
        payload = {**SAMPLE, "tipo": tipo}
        resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
        assert resp.status_code == 201


@pytest.mark.asyncio
async def test_sha256_hash_format(client: AsyncClient, auth_headers: dict):
    """Test SHA256 hash storage."""
    valid_sha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    payload = {**SAMPLE, "hash_sha256": valid_sha256}
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201
    assert resp.json()["data"]["hash_sha256"] == valid_sha256


@pytest.mark.asyncio
async def test_large_file_metadata(client: AsyncClient, auth_headers: dict):
    """Test storing large file metadata."""
    payload = {**SAMPLE, "archivo_tamanio": 5368709120}  # 5GB
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201
    assert resp.json()["data"]["archivo_tamanio"] == 5368709120
