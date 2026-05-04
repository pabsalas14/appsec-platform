"""Vulnerabilidad service — CRUD con validación de flujo configurable (BRD §11 D1)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationException
from app.models.vulnerabilidad import Vulnerabilidad
from app.schemas.vulnerabilidad import VulnerabilidadCreate, VulnerabilidadUpdate
from app.services.base import BaseService
from app.services.json_setting import get_json_setting
from app.services.sla_policy import compute_deadline, resolve_sla_days, status_disables_sla
from app.services.flujo_estatus_runtime import assert_flujo_estatus_db_transition
from app.services.vulnerabilidad_flujo import (
    assert_transicion_permitida,
    estados_activa_clasificacion,
    normalize_estado_a_id,
    parse_estatus_catalog,
)


class VulnerabilidadService(BaseService[Vulnerabilidad, VulnerabilidadCreate, VulnerabilidadUpdate]):
    async def _catalog(self, db: AsyncSession) -> list[dict[str, Any]]:
        raw = await get_json_setting(db, "catalogo.estatus_vulnerabilidad", [])
        return parse_estatus_catalog(raw)

    async def create(
        self,
        db: AsyncSession,
        schema: VulnerabilidadCreate,
        *,
        extra: dict[str, Any] | None = None,
    ) -> Vulnerabilidad:
        catalog = await self._catalog(db)
        data = schema.model_dump()
        if extra:
            data.update(extra)
        est_in = data.get("estado")
        resolved = normalize_estado_a_id(est_in, catalog) if catalog else None
        if catalog and resolved is None:
            raise ValidationException(
                f"estado '{est_in}' no coincide con el catálogo administrable de estatus de vulnerabilidad"
            )
        if resolved:
            data["estado"] = resolved
        if status_disables_sla(data.get("estado")):
            data["fecha_limite_sla"] = None
        elif data.get("fecha_limite_sla") is None:
            days = await resolve_sla_days(db, motor=data.get("fuente"), severity=data.get("severidad"))
            if days:
                data["fecha_limite_sla"] = compute_deadline(days)
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
        schema: VulnerabilidadUpdate,
        *,
        scope: dict[str, Any] | None = None,
    ) -> Vulnerabilidad | None:
        record = await self.get(db, record_id, scope=scope)
        if not record:
            return None

        changes = schema.model_dump(exclude_unset=True)
        catalog = await self._catalog(db)

        if "estado" in changes and catalog:
            prev = normalize_estado_a_id(record.estado, catalog) or record.estado
            nxt = normalize_estado_a_id(changes["estado"], catalog)
            if nxt is None:
                raise ValidationException(f"estado '{changes['estado']}' no coincide con el catálogo administrable")
            try:
                assert_transicion_permitida(catalog, str(prev), str(nxt))
            except ValueError as e:
                raise ValidationException(str(e)) from e
            await assert_flujo_estatus_db_transition(
                db,
                user_id=record.user_id,
                entity_type="vulnerabilidad",
                from_status=str(prev),
                to_status=str(nxt),
            )
            changes["estado"] = nxt

        next_estado = str(changes.get("estado", record.estado))
        next_fuente = str(changes.get("fuente", record.fuente))
        next_severidad = str(changes.get("severidad", record.severidad))
        if status_disables_sla(next_estado):
            changes["fecha_limite_sla"] = None
        else:
            active_ids = estados_activa_clasificacion(catalog) if catalog else set()
            should_refresh_deadline = (
                "fecha_limite_sla" not in changes
                and ("fuente" in changes or "severidad" in changes)
                and (not active_ids or next_estado in active_ids)
            )
            if should_refresh_deadline:
                days = await resolve_sla_days(db, motor=next_fuente, severity=next_severidad)
                if days:
                    changes["fecha_limite_sla"] = compute_deadline(days)

        for key, value in changes.items():
            setattr(record, key, value)

        await db.flush()
        await db.refresh(record)
        await self._audit(db, "update", record, metadata={"changes": _safe_dump(changes)})
        return record


def _safe_dump(data: dict[str, Any]) -> dict[str, Any]:
    import datetime as _dt
    import uuid as _uuid

    out: dict[str, Any] = {}
    for k, v in data.items():
        if isinstance(v, (_uuid.UUID, _dt.datetime, _dt.date)):
            out[k] = str(v)
        elif isinstance(v, (dict, list, tuple, int, float, str, bool)) or v is None:
            out[k] = v
        else:
            out[k] = str(v)
    return out


vulnerabilidad_svc = VulnerabilidadService(
    Vulnerabilidad,
    owner_field="user_id",
    audit_action_prefix="vulnerabilidad",
)
