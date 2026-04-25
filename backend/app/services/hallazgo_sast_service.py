"""HallazgoSast service — CRUD + sync automático con actividad mensual SAST."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hallazgo_sast import HallazgoSast
from app.schemas.hallazgo_sast import HallazgoSastCreate, HallazgoSastUpdate
from app.services.actividad_mensual_sast_service import actividad_mensual_sast_svc
from app.services.base import BaseService


class HallazgoSastService(BaseService[HallazgoSast, HallazgoSastCreate, HallazgoSastUpdate]):
    async def _sync_actividad(self, db: AsyncSession, actividad_sast_id: uuid.UUID, user_id: uuid.UUID) -> None:
        await actividad_mensual_sast_svc.sincronizar_hallazgos(
            db,
            actividad_sast_id,
            scope={"user_id": user_id},
        )

    async def create(
        self,
        db: AsyncSession,
        schema: HallazgoSastCreate,
        *,
        extra: dict[str, Any] | None = None,
    ) -> HallazgoSast:
        record = await super().create(db, schema, extra=extra)
        await self._sync_actividad(db, record.actividad_sast_id, record.user_id)
        return record

    async def update(
        self,
        db: AsyncSession,
        record_id: uuid.UUID,
        schema: HallazgoSastUpdate,
        *,
        scope: dict[str, Any] | None = None,
    ) -> HallazgoSast | None:
        record = await super().update(db, record_id, schema, scope=scope)
        if record is not None:
            await self._sync_actividad(db, record.actividad_sast_id, record.user_id)
        return record

    async def delete(
        self,
        db: AsyncSession,
        record_id: uuid.UUID,
        *,
        scope: dict[str, Any] | None = None,
        actor_id: uuid.UUID | str | None = None,
    ) -> bool:
        existing = await self.get(db, record_id, scope=scope)
        if not existing:
            return False
        actividad_sast_id = existing.actividad_sast_id
        user_id = existing.user_id
        deleted = await super().delete(db, record_id, scope=scope, actor_id=actor_id)
        if deleted:
            await self._sync_actividad(db, actividad_sast_id, user_id)
        return deleted


hallazgo_sast_svc = HallazgoSastService(
    HallazgoSast,
    owner_field="user_id",
    audit_action_prefix="hallazgo_sast",
)
