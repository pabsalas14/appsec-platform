"""
Módulo legacy (Phase 22–24). La configuración de IA vive en `ia.*` (SystemSetting)
y en `app.api.v1.admin.ia_config`. Se mantiene el nombre `ConfiguracionIAService` para
no romper imports; no usar en código nuevo.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger


class ConfiguracionIAService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_current_config(self) -> None:
        logger.warning("ia_config_service.deprecated", extra={"event": "ia_config_service.deprecated"})
        return None

    async def update_config(self, data: Any) -> None:  # noqa: ANN401
        logger.warning("ia_config_service.deprecated", extra={"event": "ia_config_service.deprecated"})
        return None

    async def test_connection(self) -> dict[str, str]:
        return {"status": "error", "message": "Usar /api/v1/admin/ia-config"}
