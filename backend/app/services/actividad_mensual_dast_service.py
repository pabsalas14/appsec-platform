"""ActividadMensualDast service: score mensual DAST con pesos admin (BRD §5.2)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.scoring_sast_mensual import compute_sast_mensual_score
from app.models.actividad_mensual_dast import ActividadMensualDast
from app.schemas.actividad_mensual_dast import ActividadMensualDastCreate, ActividadMensualDastUpdate
from app.services.base import BaseService
from app.services.json_setting import get_json_setting


class ActividadMensualDastService(
    BaseService[ActividadMensualDast, ActividadMensualDastCreate, ActividadMensualDastUpdate]
):
    async def _recompute(self, db: AsyncSession, record: ActividadMensualDast) -> None:
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
        schema: ActividadMensualDastCreate,
        *,
        extra: dict[str, Any] | None = None,
    ) -> ActividadMensualDast:
        record = await super().create(db, schema, extra=extra)
        await self._recompute(db, record)
        return record

    async def update(
        self,
        db: AsyncSession,
        record_id: uuid.UUID,
        schema: ActividadMensualDastUpdate,
        *,
        scope: dict[str, Any] | None = None,
    ) -> ActividadMensualDast | None:
        record = await super().update(db, record_id, schema, scope=scope)
        if record is not None:
            await self._recompute(db, record)
        return record


actividad_mensual_dast_svc = ActividadMensualDastService(
    ActividadMensualDast,
    owner_field="user_id",
    audit_action_prefix="actividad_mensual_dast",
)
