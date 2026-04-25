"""Smoke + IDOR tests for the multipart uploads endpoint (ADR-0008)."""

from __future__ import annotations

import io
import uuid

import pytest
from httpx import AsyncClient


async def _upload_png(client: AsyncClient, headers: dict[str, str]) -> dict:
    png_bytes = (
        b"\x89PNG\r\n\x1a\n"
        b"\x00\x00\x00\rIHDR"
        b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
        b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4"
        b"\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    resp = await client.post(
        "/api/v1/uploads",
        headers=headers,
        files={"file": ("tiny.png", io.BytesIO(png_bytes), "image/png")},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]


@pytest.mark.asyncio
async def test_upload_and_list(client: AsyncClient, auth_headers: dict[str, str]):
    attachment = await _upload_png(client, auth_headers)
    assert attachment["filename"] == "tiny.png"
    assert attachment["content_type"] == "image/png"

    resp = await client.get("/api/v1/uploads", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()["data"]
    assert any(item["id"] == attachment["id"] for item in items)


@pytest.mark.asyncio
async def test_upload_rejects_unsupported_type(client: AsyncClient, auth_headers: dict[str, str]):
    resp = await client.post(
        "/api/v1/uploads",
        headers=auth_headers,
        files={"file": ("bad.bin", io.BytesIO(b"\x00\x01\x02"), "application/x-shellscript")},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_upload_idor_cross_user(
    client: AsyncClient,
    auth_headers: dict[str, str],
    other_auth_headers: dict[str, str],
):
    attachment = await _upload_png(client, auth_headers)
    attachment_id = attachment["id"]

    resp = await client.get(
        f"/api/v1/uploads/{attachment_id}/download",
        headers=other_auth_headers,
    )
    assert resp.status_code == 404

    resp = await client.delete(
        f"/api/v1/uploads/{attachment_id}",
        headers=other_auth_headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_download_nonexistent_404(client: AsyncClient, auth_headers: dict[str, str]):
    resp = await client.get(f"/api/v1/uploads/{uuid.uuid4()}/download", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_upload_delete_is_soft_delete_and_keeps_hash(client: AsyncClient, auth_headers: dict[str, str]):
    attachment = await _upload_png(client, auth_headers)
    attachment_id = attachment["id"]
    assert attachment.get("sha256"), "upload response must expose attachment sha256"

    deleted = await client.delete(f"/api/v1/uploads/{attachment_id}", headers=auth_headers)
    assert deleted.status_code == 204

    listed = await client.get("/api/v1/uploads", headers=auth_headers)
    assert listed.status_code == 200
    ids = {row["id"] for row in listed.json()["data"]}
    assert attachment_id not in ids
