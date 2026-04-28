"""ExcepcionVulnerabilidad service — CRUD con SoD (A6) en aprobación.

Reglas:
  - Al crear: estado inicial = "Pendiente"
  - Al aprobar/rechazar: valida SoD si ReglaSoD "vulnerabilidad.aprobar_excepcion" activa
    → aprobador_id != user_id (creador original)
"""

from __future__ import annotations

import uuid
from datetime import UTC
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.excepcion_vulnerabilidad import ExcepcionVulnerabilidad
from app.models.regla_so_d import ReglaSoD
from app.models.vulnerabilidad import Vulnerabilidad
from app.schemas.excepcion_vulnerabilidad import (
    ExcepcionVulnerabilidadCreate,
    ExcepcionVulnerabilidadUpdate,
)
from app.services.base import BaseService
from app.services.json_setting import get_json_setting
from app.services.sla_policy import compute_deadline, resolve_sla_days
from app.services.vulnerabilidad_flujo import parse_estatus_catalog


class ExcepcionVulnerabilidadService(
    BaseService[
        ExcepcionVulnerabilidad,
        ExcepcionVulnerabilidadCreate,
        ExcepcionVulnerabilidadUpdate,
    ]
):
    """Extends BaseService with SoD validation on approval (A6)."""

    async def _sod_activa(self, db: AsyncSession) -> bool:
        """Retorna True si la regla SoD para aprobar excepciones está activa."""
        result = await db.execute(
            select(ReglaSoD).where(
                ReglaSoD.accion == "vulnerabilidad.aprobar_excepcion",
                ReglaSoD.enabled.is_(True),
                ReglaSoD.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none() is not None

    async def _estado_id(self, db: AsyncSession, options: set[str], fallback: str) -> str:
        raw = await get_json_setting(db, "catalogo.estatus_vulnerabilidad", [])
        catalog = parse_estatus_catalog(raw)
        for row in catalog:
            rid = str(row.get("id", "")).strip()
            if rid in options:
                return rid
        return fallback

    async def _set_vuln_exception_state(
        self,
        db: AsyncSession,
        vulnerabilidad_id: uuid.UUID,
        *,
        approved: bool,
    ) -> None:
        vuln = await db.get(Vulnerabilidad, vulnerabilidad_id)
        if vuln is None:
            return
        if approved:
            vuln.estado = await self._estado_id(db, {"excepcion"}, "excepcion")
            vuln.fecha_limite_sla = None
            return
        # Rechazo de excepción: reactivar ciclo y re-estimar SLA desde ahora
        vuln.estado = await self._estado_id(db, {"activa", "en_remediacion"}, "activa")
        days = await resolve_sla_days(db, motor=vuln.fuente, severity=vuln.severidad)
        if days:
            vuln.fecha_limite_sla = compute_deadline(days)

    async def _get_for_decision(self, db: AsyncSession, excepcion_id: uuid.UUID) -> ExcepcionVulnerabilidad | None:
        """Lee una excepción para aprobar/rechazar sin scope de owner.

        Estas acciones se autorizan por permiso granular (`vulnerabilities.approve`)
        y requieren separación de funciones; por diseño no se limitan al owner.
        """
        result = await db.execute(
            select(ExcepcionVulnerabilidad).where(
                ExcepcionVulnerabilidad.id == excepcion_id,
                ExcepcionVulnerabilidad.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def aprobar(
        self,
        db: AsyncSession,
        excepcion_id: uuid.UUID,
        aprobador_id: uuid.UUID,
        notas: str | None = None,
        *,
        scope: dict[str, Any] | None = None,
    ) -> ExcepcionVulnerabilidad | None:
        """Aprueba una excepción. Valida SoD: aprobador != creador si regla activa."""
        from datetime import datetime

        from app.core.exceptions import ConflictException

        record = await self._get_for_decision(db, excepcion_id)
        if not record:
            return None

        if await self._sod_activa(db) and record.user_id == aprobador_id:
            raise ConflictException(
                "SoD: el aprobador no puede ser el mismo usuario que solicitó la excepción "
                "(ReglaSoD: vulnerabilidad.aprobar_excepcion)"
            )

        record.estado = "Aprobada"
        record.aprobador_id = aprobador_id
        record.fecha_aprobacion = datetime.now(UTC)
        record.notas_aprobador = notas
        await self._set_vuln_exception_state(db, record.vulnerabilidad_id, approved=True)

        await db.flush()
        await db.refresh(record)
        await self._audit(db, "aprobar", record, metadata={"aprobador_id": str(aprobador_id), "notas": notas})
        return record

    async def rechazar(
        self,
        db: AsyncSession,
        excepcion_id: uuid.UUID,
        aprobador_id: uuid.UUID,
        notas: str | None = None,
        *,
        scope: dict[str, Any] | None = None,
    ) -> ExcepcionVulnerabilidad | None:
        """Rechaza una excepción. Valida SoD: aprobador != creador si regla activa."""
        from datetime import datetime

        from app.core.exceptions import ConflictException

        record = await self._get_for_decision(db, excepcion_id)
        if not record:
            return None

        if await self._sod_activa(db) and record.user_id == aprobador_id:
            raise ConflictException(
                "SoD: el aprobador no puede ser el mismo usuario que solicitó la excepción "
                "(ReglaSoD: vulnerabilidad.aprobar_excepcion)"
            )

        record.estado = "Rechazada"
        record.aprobador_id = aprobador_id
        record.fecha_aprobacion = datetime.now(UTC)
        record.notas_aprobador = notas
        await self._set_vuln_exception_state(db, record.vulnerabilidad_id, approved=False)

        await db.flush()
        await db.refresh(record)
        await self._audit(db, "rechazar", record, metadata={"aprobador_id": str(aprobador_id), "notas": notas})
        return record


excepcion_vulnerabilidad_svc = ExcepcionVulnerabilidadService(
    ExcepcionVulnerabilidad,
    owner_field="user_id",
    audit_action_prefix="excepcion_vulnerabilidad",
)
