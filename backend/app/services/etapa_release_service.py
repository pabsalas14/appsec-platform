"""EtapaRelease service — CRUD con SoD (A6) en aprobación y rechazo de etapas.

Reglas:
  - Al crear: estado inicial = "Pendiente"
  - Al aprobar: valida SoD si ReglaSoD "release.aprobar" activa
    → aprobador_id != user_id del ServiceRelease (no del EtapaRelease)
  - Al rechazar: justificación obligatoria (A1) — validada en schema
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.etapa_release import EtapaRelease
from app.models.regla_so_d import ReglaSoD
from app.models.service_release import ServiceRelease
from app.schemas.etapa_release import EtapaReleaseCreate, EtapaReleaseUpdate
from app.services.base import BaseService


class EtapaReleaseService(
    BaseService[EtapaRelease, EtapaReleaseCreate, EtapaReleaseUpdate]
):
    """Extends BaseService with SoD validation on etapa approval (A6)."""

    async def _sod_activa(self, db: AsyncSession) -> bool:
        """Retorna True si la regla SoD para aprobar releases está activa."""
        result = await db.execute(
            select(ReglaSoD).where(
                ReglaSoD.accion == "release.aprobar",
                ReglaSoD.enabled.is_(True),
                ReglaSoD.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none() is not None

    async def _get_service_release_owner(
        self, db: AsyncSession, service_release_id: uuid.UUID
    ) -> uuid.UUID | None:
        """Obtiene el user_id del ServiceRelease padre."""
        result = await db.execute(
            select(ServiceRelease.user_id).where(
                ServiceRelease.id == service_release_id,
                ServiceRelease.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def _get_for_decision(
        self, db: AsyncSession, etapa_id: uuid.UUID
    ) -> EtapaRelease | None:
        """Lee la etapa a aprobar/rechazar sin scope de owner.

        La autorización se valida con permiso granular (`releases.approve`)
        y el control SoD se aplica contra el dueño del ServiceRelease.
        """
        result = await db.execute(
            select(EtapaRelease).where(
                EtapaRelease.id == etapa_id,
                EtapaRelease.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def aprobar(
        self,
        db: AsyncSession,
        etapa_id: uuid.UUID,
        aprobador_id: uuid.UUID,
        notas: str | None = None,
        *,
        scope: dict[str, Any] | None = None,
    ) -> EtapaRelease | None:
        """Aprueba una etapa.

        SoD: si la regla está activa, el aprobador no puede ser el mismo
        usuario que creó el ServiceRelease padre.
        """
        from app.core.exceptions import ConflictException

        record = await self._get_for_decision(db, etapa_id)
        if not record:
            return None

        if await self._sod_activa(db):
            release_owner = await self._get_service_release_owner(
                db, record.service_release_id
            )
            if release_owner is not None and release_owner == aprobador_id:
                raise ConflictException(
                    "SoD: el aprobador no puede ser el creador del ServiceRelease "
                    "(ReglaSoD: release.aprobar)"
                )

        record.estado = "Aprobada"
        record.aprobador_id = aprobador_id
        record.fecha_completada = datetime.now(timezone.utc)
        record.notas = notas

        await db.flush()
        await db.refresh(record)
        await self._audit(
            db,
            "aprobar",
            record,
            metadata={"aprobador_id": str(aprobador_id), "notas": notas},
        )
        return record

    async def rechazar(
        self,
        db: AsyncSession,
        etapa_id: uuid.UUID,
        aprobador_id: uuid.UUID,
        justificacion: str,
        notas: str | None = None,
        *,
        scope: dict[str, Any] | None = None,
    ) -> EtapaRelease | None:
        """Rechaza una etapa.

        justificacion obligatoria (A1) — validada en schema antes de llegar aquí.
        SoD: mismo chequeo que en aprobar.
        """
        from app.core.exceptions import ConflictException

        record = await self._get_for_decision(db, etapa_id)
        if not record:
            return None

        if await self._sod_activa(db):
            release_owner = await self._get_service_release_owner(
                db, record.service_release_id
            )
            if release_owner is not None and release_owner == aprobador_id:
                raise ConflictException(
                    "SoD: el aprobador no puede ser el creador del ServiceRelease "
                    "(ReglaSoD: release.aprobar)"
                )

        record.estado = "Rechazada"
        record.aprobador_id = aprobador_id
        record.fecha_completada = datetime.now(timezone.utc)
        record.justificacion = justificacion
        record.notas = notas

        await db.flush()
        await db.refresh(record)
        await self._audit(
            db,
            "rechazar",
            record,
            metadata={
                "aprobador_id": str(aprobador_id),
                "justificacion": justificacion,
                "notas": notas,
            },
        )
        return record


etapa_release_svc = EtapaReleaseService(
    EtapaRelease,
    owner_field="user_id",
    audit_action_prefix="etapa_release",
)
