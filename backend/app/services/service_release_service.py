"""ServiceRelease service — C1/C3: transiciones según `flujo.transiciones_liberacion` (ajustes admin)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationException
from app.models.service_release import ServiceRelease
from app.schemas.service_release import (
    ServiceReleaseCreate,
    ServiceReleaseUpdate,
)
from app.services.base import BaseService
from app.services.json_setting import get_json_setting


def _assert_transicion_liberacion(graph: object, prev: str, nxt: str) -> None:
    if not isinstance(graph, dict) or not graph:
        return
    allowed = graph.get(prev)
    if not isinstance(allowed, list) or not allowed:
        return
    if nxt not in allowed:
        raise ValidationException(
            f"Transición de liberación no permitida: '{prev}' → '{nxt}'. Permitidas: {allowed}"
        )


class ServiceReleaseService(BaseService[ServiceRelease, ServiceReleaseCreate, ServiceReleaseUpdate]):
    async def create(
        self,
        db: AsyncSession,
        schema: ServiceReleaseCreate,
        *,
        extra: dict[str, Any] | None = None,
    ) -> ServiceRelease:
        data = schema.model_dump()
        if extra:
            data.update(extra)
        if data.get("fecha_entrada") is None:
            data["fecha_entrada"] = datetime.now(UTC)
        record = self.model(**data)
        db.add(record)
        await db.flush()
        await db.refresh(record)
        await self._audit(db, "create", record, metadata={"created": _safe_dump(data)})
        return record

    async def update(
        self,
        db: AsyncSession,
        record_id: uuid.UUID | int,
        schema: ServiceReleaseUpdate,
        *,
        scope: dict[str, Any] | None = None,
    ) -> ServiceRelease | None:
        record = await self.get(db, record_id, scope=scope)
        if not record:
            return None
        changes = schema.model_dump(exclude_unset=True)
        if "estado_actual" in changes and changes["estado_actual"] != record.estado_actual:
            graph = await get_json_setting(db, "flujo.transiciones_liberacion", None)
            _assert_transicion_liberacion(graph, record.estado_actual, changes["estado_actual"])
        for key, value in changes.items():
            setattr(record, key, value)
        await db.flush()
        await db.refresh(record)
        await self._audit(db, "update", record, metadata={"changes": _safe_dump(changes)})
        return record


def _safe_dump(data: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for k, v in data.items():
        if isinstance(v, (uuid.UUID, datetime)):
            out[k] = str(v)
        elif isinstance(v, (dict, list, tuple, int, float, str, bool)) or v is None:
            out[k] = v
        else:
            out[k] = str(v)
    return out


service_release_svc = ServiceReleaseService(
    ServiceRelease,
    owner_field="user_id",
    audit_action_prefix="service_release",
)
