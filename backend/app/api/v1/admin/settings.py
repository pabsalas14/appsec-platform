"""Admin system-settings endpoints.

Seeds a handful of default settings on first access so the UI has something
editable out of the box.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.core.exceptions import NotFoundException
from app.core.response import success
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.schemas.system_setting import SystemSettingRead, SystemSettingUpsert
from app.services.audit_service import record as audit_record

router = APIRouter()


DEFAULT_SETTINGS: list[dict] = [
    {
        "key": "app.display_name",
        "value": "Development Framework",
        "description": "Product name shown in the UI header.",
    },
    {
        "key": "app.default_theme",
        "value": "system",
        "description": "Initial theme for new users (light | dark | system).",
    },
    {
        "key": "features.registration_open",
        "value": True,
        "description": "Whether self-service registration is enabled.",
    },
    {
        "key": "features.audit_log_retention_days",
        "value": 90,
        "description": "How long (in days) to keep audit_logs rows.",
    },
]


async def _ensure_seeded(db: AsyncSession) -> None:
    for row in DEFAULT_SETTINGS:
        stmt = (
            pg_insert(SystemSetting)
            .values(**row)
            .on_conflict_do_nothing(index_elements=[SystemSetting.key])
        )
        await db.execute(stmt)
    await db.flush()


@router.get("")
async def list_settings(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    await _ensure_seeded(db)
    rows = (
        await db.execute(select(SystemSetting).order_by(SystemSetting.key))
    ).scalars().all()
    return success(
        [SystemSettingRead.model_validate(r).model_dump(mode="json") for r in rows]
    )


@router.get("/{key}")
async def get_setting(
    key: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    row = (
        await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    ).scalar_one_or_none()
    if not row:
        raise NotFoundException("Setting not found")
    return success(SystemSettingRead.model_validate(row).model_dump(mode="json"))


@router.put("/{key}")
async def put_setting(
    key: str,
    payload: SystemSettingUpsert,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """Upsert a setting by key. The description is optional."""
    row = (
        await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    ).scalar_one_or_none()
    if row is None:
        row = SystemSetting(
            key=key, value=payload.value, description=payload.description
        )
        db.add(row)
    else:
        row.value = payload.value
        if payload.description is not None:
            row.description = payload.description
    await db.flush()
    await db.refresh(row)

    await audit_record(
        db,
        action="system_setting.update",
        entity_type="system_settings",
        entity_id=key,
        metadata={"key": key},
    )
    return success(SystemSettingRead.model_validate(row).model_dump(mode="json"))
