"""Auditoria service — async CRUD with enforced per-user ownership."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationException
from app.models.auditoria import Auditoria
from app.schemas.auditoria import AuditoriaCreate, AuditoriaUpdate
from app.services.base import BaseService

_AUDITORIA_ESTADO_ORDER = ["Planificada", "Ejecución", "Revisión", "Cerrada"]


def _estado_index(estado: str | None) -> int | None:
    if not estado:
        return None
    e = estado.strip().lower()
    for i, canon in enumerate(_AUDITORIA_ESTADO_ORDER):
        if canon.lower() == e:
            return i
    return None


class AuditoriaService(BaseService[Auditoria, AuditoriaCreate, AuditoriaUpdate]):
    """Auditorías con validación laxa de transiciones de estado (flujo BRD)."""

    def __init__(self) -> None:
        super().__init__(
            Auditoria,
            owner_field="user_id",
            audit_action_prefix="auditoria",
        )

    async def update(
        self,
        db: AsyncSession,
        record_id: uuid.UUID | int,
        schema: AuditoriaUpdate,
        *,
        scope: dict[str, Any] | None = None,
    ) -> Auditoria | None:
        raw = schema.model_dump(exclude_unset=True)
        if "estado" not in raw:
            return await super().update(db, record_id, schema, scope=scope)

        record = await self.get(db, record_id, scope=scope)
        if not record:
            return None

        old_i = _estado_index(getattr(record, "estado", None))
        new_i = _estado_index(raw["estado"])
        if old_i is not None and new_i is not None:
            if new_i < old_i:
                raise ValidationException("No se permite retroceder el estado de la auditoría.")
            if new_i != old_i and (new_i - old_i) != 1:
                raise ValidationException(
                    f"Transición de estado no permitida: «{record.estado}» → «{raw['estado']}». "
                    f"Use el orden: {' → '.join(_AUDITORIA_ESTADO_ORDER)} (un paso a la vez)."
                )

        return await super().update(db, record_id, schema, scope=scope)


auditoria_svc = AuditoriaService()
