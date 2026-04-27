"""ActividadMensualSast service: score mensual SAST con pesos admin (BRD B1-B2)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.hallazgo_sast_counts import aggregate_hallazgo_labels
from app.core.scoring_sast_mensual import compute_sast_mensual_score
from app.models.actividad_mensual_sast import ActividadMensualSast
from app.models.hallazgo_sast import HallazgoSast
from app.schemas.actividad_mensual_sast import ActividadMensualSastCreate, ActividadMensualSastUpdate
from app.services.base import BaseService
from app.services.json_setting import get_json_setting


class ActividadMensualSastService(
    BaseService[ActividadMensualSast, ActividadMensualSastCreate, ActividadMensualSastUpdate]
):
    async def _recompute(self, db: AsyncSession, record: ActividadMensualSast) -> None:
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
        schema: ActividadMensualSastCreate,
        *,
        extra: dict[str, Any] | None = None,
    ) -> ActividadMensualSast:
        record = await super().create(db, schema, extra=extra)
        await self._recompute(db, record)
        return record

    async def update(
        self,
        db: AsyncSession,
        record_id: uuid.UUID,
        schema: ActividadMensualSastUpdate,
        *,
        scope: dict[str, Any] | None = None,
    ) -> ActividadMensualSast | None:
        record = await super().update(db, record_id, schema, scope=scope)
        if record is not None:
            await self._recompute(db, record)
        return record

    async def sincronizar_hallazgos(
        self,
        db: AsyncSession,
        record_id: uuid.UUID,
        *,
        scope: dict[str, Any] | None = None,
    ) -> ActividadMensualSast | None:
        record = await self.get(db, record_id, scope=scope)
        if not record:
            return None
        if scope and self.owner_field and self.owner_field in scope:
            user_id = scope[self.owner_field]
        else:
            user_id = record.user_id
        del_at = getattr(HallazgoSast, "deleted_at", None)
        stmt = select(HallazgoSast.severidad).where(
            HallazgoSast.actividad_sast_id == record_id,
            HallazgoSast.user_id == user_id,
        )
        if del_at is not None:
            stmt = stmt.where(HallazgoSast.deleted_at.is_(None))
        sevs = (await db.execute(stmt)).scalars().all()
        ag = aggregate_hallazgo_labels([str(s) for s in sevs])
        record.criticos = ag["criticos"]
        record.altos = ag["altos"]
        record.medios = ag["medios"]
        record.bajos = ag["bajos"]
        await self._recompute(db, record)
        await self._audit(
            db,
            "update",
            record,
            metadata={"event": "sincronizar_hallazgos", "rows": ag["total"]},
        )
        return record


actividad_mensual_sast_svc = ActividadMensualSastService(
    ActividadMensualSast,
    owner_field="user_id",
    audit_action_prefix="actividad_mensual_sast",
)
