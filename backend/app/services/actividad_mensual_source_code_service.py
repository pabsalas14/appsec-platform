"""ActividadMensualSourceCode service: score mensual Source Code (BRD §5.4)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.scoring_sast_mensual import compute_sast_mensual_score
from app.models.actividad_mensual_source_code import ActividadMensualSourceCode
from app.schemas.actividad_mensual_source_code import ActividadMensualSourceCodeCreate, ActividadMensualSourceCodeUpdate
from app.services.base import BaseService
from app.services.json_setting import get_json_setting


class ActividadMensualSourceCodeService(
    BaseService[ActividadMensualSourceCode, ActividadMensualSourceCodeCreate, ActividadMensualSourceCodeUpdate]
):
    async def _recompute(self, db: AsyncSession, record: ActividadMensualSourceCode) -> None:
        c = int(record.criticos or 0)
        a = int(record.altos or 0)
        m = int(record.medios or 0)
        bj = int(record.bajos or 0)
        total = c + a + m + bj
        record.total_hallazgos = total
        pesos = await get_json_setting(db, "scoring.pesos_severidad", None)
        record.score = compute_sast_mensual_score(c, a, m, bj, pesos_severidad=pesos)
        await db.flush()
        await db.refresh(record)

    async def create(
        self,
        db: AsyncSession,
        schema: ActividadMensualSourceCodeCreate,
        *,
        extra: dict[str, Any] | None = None,
    ) -> ActividadMensualSourceCode:
        record = await super().create(db, schema, extra=extra)
        await self._recompute(db, record)
        return record

    async def update(
        self,
        db: AsyncSession,
        record_id: uuid.UUID,
        schema: ActividadMensualSourceCodeUpdate,
        *,
        scope: dict[str, Any] | None = None,
    ) -> ActividadMensualSourceCode | None:
        record = await super().update(db, record_id, schema, scope=scope)
        if record is not None:
            await self._recompute(db, record)
        return record


actividad_mensual_source_code_svc = ActividadMensualSourceCodeService(
    ActividadMensualSourceCode,
    owner_field="user_id",
    audit_action_prefix="actividad_mensual_source_code",
)
