"""Tests for upload endpoint — blocked extension enforcement."""

from __future__ import annotations

import io

import pytest
from httpx import AsyncClient


def _make_file(filename: str, content: bytes = b"content", content_type: str = "text/plain"):
    return {"file": (filename, io.BytesIO(content), content_type)}


@pytest.mark.asyncio
async def test_upload_exe_blocked(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """.exe files are blocked with 422."""
    r = await client.post(
        "/api/v1/uploads",
        files=_make_file("malware.exe", b"MZ" + b"\x00" * 10, "application/octet-stream"),
        headers=admin_auth_headers,
    )
    assert r.status_code == 422
    assert "exe" in r.text.lower() or "extension" in r.text.lower() or "allowed" in r.text.lower()


@pytest.mark.asyncio
async def test_upload_sh_blocked(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """.sh files are blocked with 422."""
    r = await client.post(
        "/api/v1/uploads",
        files=_make_file("script.sh", b"#!/bin/bash\nrm -rf /", "text/plain"),
        headers=admin_auth_headers,
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_upload_bat_blocked(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """.bat files are blocked with 422."""
    r = await client.post(
        "/api/v1/uploads",
        files=_make_file("attack.bat", b"@echo off\ndel /f /q C:\\*", "text/plain"),
        headers=admin_auth_headers,
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_upload_ps1_blocked(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """.ps1 PowerShell scripts are blocked."""
    r = await client.post(
        "/api/v1/uploads",
        files=_make_file("evil.ps1", b"Invoke-Expression $payload", "text/plain"),
        headers=admin_auth_headers,
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_upload_jar_blocked(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """.jar files are blocked."""
    r = await client.post(
        "/api/v1/uploads",
        files=_make_file("app.jar", b"PK\x03\x04", "application/zip"),
        headers=admin_auth_headers,
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_upload_pdf_allowed(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Safe PDF files should pass the extension check (may fail on magic numbers but not extension)."""
    r = await client.post(
        "/api/v1/uploads",
        files=_make_file("report.pdf", b"%PDF-1.4 fake", "application/pdf"),
        headers=admin_auth_headers,
    )
    # Should not be blocked for extension (may fail magic number check, that's ok)
    assert r.status_code != 422 or "extension" not in (r.json().get("detail") or "")


@pytest.mark.asyncio
async def test_upload_png_allowed(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """.png extension is allowed (content validation may still fail)."""
    r = await client.post(
        "/api/v1/uploads",
        files=_make_file("screenshot.png", b"\x89PNG\r\n\x1a\n" + b"\x00" * 100, "image/png"),
        headers=admin_auth_headers,
    )
    assert r.status_code != 422 or "extension" not in (r.json().get("detail") or "").lower()


@pytest.mark.asyncio
async def test_upload_unauthenticated_blocked(client: AsyncClient):
    """Upload without auth returns 401/403."""
    r = await client.post(
        "/api/v1/uploads",
        files=_make_file("file.txt", b"hello"),
    )
    assert r.status_code in (401, 403)


def test_blocked_extension_check():
    """Direct unit test for _check_blocked_extension."""
    from app.api.v1.uploads import _check_blocked_extension
    from app.core.exceptions import ValidationException

    for ext in (".exe", ".bat", ".sh", ".ps1", ".jar", ".dll", ".vbs"):
        with pytest.raises(ValidationException):
            _check_blocked_extension(f"file{ext}")


def test_allowed_extensions_pass():
    """Safe extensions do not raise."""
    from app.api.v1.uploads import _check_blocked_extension

    for name in ("report.pdf", "image.png", "data.csv", "notes.txt", "archive.zip"):
        _check_blocked_extension(name)  # should not raise
