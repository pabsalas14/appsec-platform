"""AceptacionRiesgo service — CRUD con SoD (A6) en aprobación.

Reglas:
  - Al crear: estado inicial = "Pendiente"
  - Al aprobar/rechazar: valida SoD si ReglaSoD "vulnerabilidad.aceptar_riesgo" activa
    → aprobador_id != user_id (quien registró el riesgo)
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.aceptacion_riesgo import AceptacionRiesgo
from app.models.regla_so_d import ReglaSoD
from app.schemas.aceptacion_riesgo import (
    AceptacionRiesgoCreate,
    AceptacionRiesgoUpdate,
)
from app.services.base import BaseService


class AceptacionRiesgoService(
    BaseService[AceptacionRiesgo, AceptacionRiesgoCreate, AceptacionRiesgoUpdate]
):
    """Extends BaseService with SoD validation on approval (A6)."""

    async def _sod_activa(self, db: AsyncSession) -> bool:
        """Retorna True si la regla SoD para aceptar riesgo está activa."""
        result = await db.execute(
            select(ReglaSoD).where(
                ReglaSoD.accion == "vulnerabilidad.aceptar_riesgo",
                ReglaSoD.enabled.is_(True),
                ReglaSoD.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none() is not None

    async def _get_for_decision(
        self, db: AsyncSession, aceptacion_id: uuid.UUID
    ) -> AceptacionRiesgo | None:
        """Lee una aceptación para aprobar/rechazar sin scope de owner.

        Estas acciones se autorizan por permiso granular (`vulnerabilities.approve`)
        y requieren separación de funciones; por diseño no se limitan al owner.
        """
        result = await db.execute(
            select(AceptacionRiesgo).where(
                AceptacionRiesgo.id == aceptacion_id,
                AceptacionRiesgo.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def aprobar(
        self,
        db: AsyncSession,
        aceptacion_id: uuid.UUID,
        aprobador_id: uuid.UUID,
        notas: str | None = None,
        *,
        scope: dict[str, Any] | None = None,
    ) -> AceptacionRiesgo | None:
        """Aprueba una aceptación de riesgo. Valida SoD: aprobador != creador."""
        from datetime import datetime, timezone
        from app.core.exceptions import ConflictException

        record = await self._get_for_decision(db, aceptacion_id)
        if not record:
            return None

        if await self._sod_activa(db):
            if record.user_id == aprobador_id:
                raise ConflictException(
                    "SoD: quien registra el riesgo no puede ser quien lo aprueba "
                    "(ReglaSoD: vulnerabilidad.aceptar_riesgo)"
                )

        record.estado = "Aprobada"
        record.aprobador_id = aprobador_id
        record.fecha_aprobacion = datetime.now(timezone.utc)
        record.notas_aprobador = notas

        await db.flush()
        await db.refresh(record)
        await self._audit(
            db, "aprobar", record,
            metadata={"aprobador_id": str(aprobador_id), "notas": notas}
        )
        return record

    async def rechazar(
        self,
        db: AsyncSession,
        aceptacion_id: uuid.UUID,
        aprobador_id: uuid.UUID,
        notas: str | None = None,
        *,
        scope: dict[str, Any] | None = None,
    ) -> AceptacionRiesgo | None:
        """Rechaza una aceptación de riesgo. Valida SoD: aprobador != creador."""
        from datetime import datetime, timezone
        from app.core.exceptions import ConflictException

        record = await self._get_for_decision(db, aceptacion_id)
        if not record:
            return None

        if await self._sod_activa(db):
            if record.user_id == aprobador_id:
                raise ConflictException(
                    "SoD: quien registra el riesgo no puede ser quien lo aprueba "
                    "(ReglaSoD: vulnerabilidad.aceptar_riesgo)"
                )

        record.estado = "Rechazada"
        record.aprobador_id = aprobador_id
        record.fecha_aprobacion = datetime.now(timezone.utc)
        record.notas_aprobador = notas

        await db.flush()
        await db.refresh(record)
        await self._audit(
            db, "rechazar", record,
            metadata={"aprobador_id": str(aprobador_id), "notas": notas}
        )
        return record


aceptacion_riesgo_svc = AceptacionRiesgoService(
    AceptacionRiesgo,
    owner_field="user_id",
    audit_action_prefix="aceptacion_riesgo",
)
