"""Lectura de filas `system_settings` (JSON) para lógica de negocio."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system_setting import SystemSetting


async def get_json_setting(db: AsyncSession, key: str, default: Any) -> Any:
    """Valor JSON de `SystemSetting` o `default` si no existe fila o falla en DB."""
    val = (await db.execute(select(SystemSetting.value).where(SystemSetting.key == key))).scalar_one_or_none()
    return default if val is None else val
