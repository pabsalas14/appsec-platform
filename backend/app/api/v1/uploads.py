"""Uploads endpoint — demo of multipart file upload with per-user ownership.

Files are persisted on disk under ``UPLOAD_DIR`` (defaults to ``uploads/``)
using a per-user subdirectory. Metadata is stored in the ``attachments`` table.
"""

from __future__ import annotations

import hashlib
import os
import uuid
from datetime import UTC
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.config import settings
from app.core.exceptions import NotFoundException, ValidationException
from app.core.response import paginated, success
from app.models.attachment import Attachment
from app.models.user import User
from app.schemas.attachment import AttachmentRead
from app.services.audit_service import record as audit_record

router = APIRouter()

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "uploads")).resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/json",
    "application/zip",
}

# Extensions blocked regardless of declared content-type (executable/script files).
# This is defence-in-depth: even if someone spoofs the MIME type, the filename
# extension check will reject known dangerous executables and scripts.
_BLOCKED_EXTENSIONS: frozenset[str] = frozenset(
    {
        # Windows executables and scripts
        ".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".vbs", ".vbe",
        ".js", ".jse", ".ws", ".wsf", ".wsc", ".wsh", ".ps1", ".ps1xml",
        ".ps2", ".ps2xml", ".psc1", ".psc2", ".msh", ".msh1", ".msh2",
        ".mshxml", ".msh1xml", ".msh2xml", ".msi", ".msp", ".mst",
        # Unix/Linux executables and scripts
        ".sh", ".bash", ".zsh", ".ksh", ".csh", ".tcsh", ".fish",
        ".run", ".bin",
        # Other risky types
        ".jar", ".class", ".dll", ".so", ".dylib",
        ".reg", ".inf", ".lnk", ".url",
    }
)


def _check_blocked_extension(filename: str) -> None:
    """Raise ValidationException if the filename has a blocked extension."""
    if not filename:
        return
    # Handle compound extensions like .tar.gz — check the last suffix
    suffix = Path(filename).suffix.lower()
    if suffix in _BLOCKED_EXTENSIONS:
        raise ValidationException(
            f"File extension '{suffix}' is not allowed for security reasons. "
            "Executable and script files are blocked."
        )

_MAGIC = {
    "application/pdf": [b"%PDF-"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/gif": [b"GIF87a", b"GIF89a"],
    # ZIP local file header + empty archive + spanning signature
    "application/zip": [b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"],
}


def _is_probably_text(data: bytes) -> bool:
    # Reject NUL bytes and non-UTF8 payloads. This is intentionally strict to
    # avoid allowing arbitrary binary blobs under text/* types.
    if b"\x00" in data:
        return False
    try:
        data.decode("utf-8")
    except UnicodeDecodeError:
        return False
    return True


def _validate_magic_numbers(*, declared: str, data: bytes) -> None:
    # Enforce "real" type for high-risk formats (PDF/images/zip) using file signatures.
    declared = declared or "application/octet-stream"
    prefixes = _MAGIC.get(declared)
    if prefixes:
        if not any(data.startswith(pfx) for pfx in prefixes):
            raise ValidationException(
                f"File content does not match declared content type: {declared} (magic number mismatch)"
            )
        return

    # For text-like declared types, require UTF-8-ish content.
    if declared in {"text/plain", "text/csv", "text/markdown", "application/json", "image/svg+xml"}:
        if not _is_probably_text(data):
            raise ValidationException(
                f"File content does not match declared content type: {declared} (expected text payload)"
            )
        if declared == "application/json":
            stripped = data.lstrip()
            if stripped and stripped[:1] not in (b"{", b"["):
                raise ValidationException("File content does not match declared content type: application/json")
        if declared == "image/svg+xml":
            stripped = data.lstrip().lower()
            if not (stripped.startswith(b"<svg") or stripped.startswith(b"<?xml")):
                raise ValidationException("File content does not match declared content type: image/svg+xml")
        return

    # Otherwise: rely on allowlist only.


def _user_dir(user_id: uuid.UUID) -> Path:
    d = UPLOAD_DIR / str(user_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


@router.get("")
async def list_uploads(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = (
        await db.execute(
            select(func.count())
            .select_from(Attachment)
            .where(Attachment.user_id == current_user.id)
            .where(Attachment.deleted_at.is_(None))
        )
    ).scalar_one()

    stmt = (
        select(Attachment)
        .where(Attachment.user_id == current_user.id)
        .where(Attachment.deleted_at.is_(None))
        .order_by(Attachment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return paginated(
        [AttachmentRead.model_validate(r).model_dump(mode="json") for r in rows],
        page=page,
        page_size=page_size,
        total=int(total),
    )


@router.post("", status_code=201)
async def create_upload(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Block dangerous file extensions before reading file contents
    _check_blocked_extension(file.filename or "")

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationException(f"Unsupported content type: {content_type}")

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise ValidationException(f"File exceeds max upload size of {settings.MAX_UPLOAD_SIZE_MB} MB")

    _validate_magic_numbers(declared=content_type, data=contents)

    sha256 = hashlib.sha256(contents).hexdigest()

    attachment_id = uuid.uuid4()
    safe_name = Path(file.filename or "file").name
    target = _user_dir(current_user.id) / f"{attachment_id}_{safe_name}"
    target.write_bytes(contents)

    row = Attachment(
        id=attachment_id,
        user_id=current_user.id,
        filename=safe_name,
        content_type=content_type,
        size=len(contents),
        storage_path=str(target),
        sha256=sha256,
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)

    await audit_record(
        db,
        action="attachment.create",
        entity_type="attachments",
        entity_id=row.id,
        metadata={"filename": safe_name, "size": len(contents), "sha256": sha256},
    )
    return success(AttachmentRead.model_validate(row).model_dump(mode="json"))


@router.get("/{attachment_id}/download")
async def download_upload(
    attachment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        await db.execute(
            select(Attachment).where(
                Attachment.id == attachment_id,
                Attachment.user_id == current_user.id,
                Attachment.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if not row:
        raise NotFoundException("Attachment not found")

    path = Path(row.storage_path)
    if not os.path.exists(row.storage_path):  # noqa: ASYNC240
        raise NotFoundException("Stored file is missing")
    return FileResponse(path, media_type=row.content_type, filename=row.filename)


@router.delete("/{attachment_id}", status_code=204)
async def delete_upload(
    attachment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        await db.execute(
            select(Attachment).where(
                Attachment.id == attachment_id,
                Attachment.user_id == current_user.id,
                Attachment.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if not row:
        raise NotFoundException("Attachment not found")

    # Soft-delete (A2): keep metadata & file for evidentiary integrity.
    from datetime import datetime

    row.deleted_at = datetime.now(UTC)
    row.deleted_by = current_user.id
    await db.flush()
    await audit_record(
        db,
        action="attachment.delete",
        entity_type="attachments",
        entity_id=attachment_id,
    )
    return None
