"""PlanRemediacion service — CRUD + máquina de estados de aprobación (spec planes de remediación)."""

from __future__ import annotations

import re
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationException
from app.models.plan_remediacion import PlanRemediacion
from app.schemas.plan_remediacion import PlanRemediacionCreate, PlanRemediacionUpdate
from app.services.base import BaseService


def _fold_estado(s: str) -> str:
    t = s.strip().lower()
    t = (
        t.replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .replace("ñ", "n")
    )
    t = re.sub(r"\s+", " ", t)
    return t


# Claves normalizadas (_fold_estado)
_PLAN_ESTADO_FLOW: dict[str, set[str]] = {
    "borrador": {"en aprobacion"},
    "en aprobacion": {"aprobado", "borrador"},
    "aprobado": {"en ejecucion", "en aprobacion"},
    "en ejecucion": {"cerrado", "aprobado"},
    "cerrado": set(),
}


class PlanRemediacionService(BaseService[PlanRemediacion, PlanRemediacionCreate, PlanRemediacionUpdate]):
    async def update(
        self,
        db: AsyncSession,
        record_id: uuid.UUID | int,
        schema: PlanRemediacionUpdate,
        *,
        scope: dict[str, Any] | None = None,
    ) -> PlanRemediacion | None:
        record = await self.get(db, record_id, scope=scope)
        if not record:
            return None
        changes = schema.model_dump(exclude_unset=True)
        if "estado" in changes:
            prev_f = _fold_estado(record.estado)
            nxt_f = _fold_estado(changes["estado"])
            if prev_f != nxt_f:
                allowed = _PLAN_ESTADO_FLOW.get(prev_f)
                if allowed is not None and nxt_f not in allowed:
                    raise ValidationException(
                        f"Transición de estado no permitida: '{record.estado}' → '{changes['estado']}'. "
                        f"Permitidos desde este estado: {sorted(allowed) if allowed else '(ninguno — terminal)'}"
                    )
        return await super().update(db, record_id, schema, scope=scope)


plan_remediacion_svc = PlanRemediacionService(
    PlanRemediacion,
    owner_field="user_id",
    audit_action_prefix="plan_remediacion",
)
