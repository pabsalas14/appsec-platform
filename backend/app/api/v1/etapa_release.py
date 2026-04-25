"""EtapaRelease CRUD endpoints + endpoints de aprobación con SoD (A6)."""

from __future__ import annotations

import csv
import hashlib
from io import StringIO
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_permission
from app.api.deps_ownership import require_ownership
from app.core.exceptions import NotFoundException
from app.core.permissions import P
from app.core.response import success
from app.models.etapa_release import EtapaRelease
from app.models.user import User
from app.schemas.etapa_release import (
    EtapaAprobarRequest,
    EtapaRechazarRequest,
    EtapaReleaseCreate,
    EtapaReleaseRead,
    EtapaReleaseUpdate,
)
from app.services.audit_service import record as audit_record
from app.services.etapa_release_service import etapa_release_svc

router = APIRouter()


@router.get("/export.csv")
async def export_etapa_releases_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Exporta etapas de releases del usuario a CSV y registra auditoría A7."""
    items = await etapa_release_svc.list(db, filters={"user_id": current_user.id})
    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "id",
            "service_release_id",
            "etapa",
            "estado",
            "created_at",
            "fecha_completada",
            "aprobador_id",
        ]
    )
    for etapa in items:
        writer.writerow(
            [
                str(etapa.id),
                str(etapa.service_release_id),
                etapa.etapa,
                etapa.estado,
                etapa.created_at.isoformat() if etapa.created_at else "",
                etapa.fecha_completada.isoformat() if etapa.fecha_completada else "",
                str(etapa.aprobador_id) if etapa.aprobador_id else "",
            ]
        )
    body = buf.getvalue()
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    await audit_record(
        db,
        action="etapa_release.export_csv",
        entity_type="etapa_release",
        entity_id=current_user.id,
        metadata={"rows": len(items), "sha256": digest, "format": "csv"},
    )
    return Response(
        content=body,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="etapa_releases.csv"'},
    )


@router.get("")
async def list_etapa_releases(
    service_release_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista etapas del usuario. Filtrar por ?service_release_id=<uuid>."""
    filters: dict = {"user_id": current_user.id}
    if service_release_id:
        filters["service_release_id"] = service_release_id
    items = await etapa_release_svc.list(db, filters=filters)
    return success(
        [EtapaReleaseRead.model_validate(x).model_dump(mode="json") for x in items]
    )


@router.get("/{id}")
async def get_etapa_release(
    entity: EtapaRelease = Depends(require_ownership(etapa_release_svc)),
):
    """Obtiene una etapa por ID (404 si no pertenece al usuario)."""
    return success(EtapaReleaseRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_etapa_release(
    entity_in: EtapaReleaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea una nueva etapa para el usuario autenticado."""
    entity = await etapa_release_svc.create(
        db, entity_in, extra={"user_id": current_user.id}
    )
    return success(EtapaReleaseRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_etapa_release(
    entity_in: EtapaReleaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: EtapaRelease = Depends(require_ownership(etapa_release_svc)),
):
    """Actualiza parcialmente una etapa (404 si no es del usuario)."""
    updated = await etapa_release_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(EtapaReleaseRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_etapa_release(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: EtapaRelease = Depends(require_ownership(etapa_release_svc)),
):
    """Elimina (soft-delete) una etapa (404 si no es del usuario)."""
    await etapa_release_svc.delete(
        db, entity.id, scope={"user_id": current_user.id}, actor_id=current_user.id
    )
    return success(None, meta={"message": "EtapaRelease eliminada"})


# ─── Aprobación con SoD (A6) ────────────────────────────────────────────────

@router.post("/{id}/aprobar")
async def aprobar_etapa(
    id: UUID,
    body: EtapaAprobarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.RELEASES.APPROVE)),
):
    """Aprueba una etapa.

    Si la ReglaSoD 'release.aprobar' está activa, el aprobador no puede ser
    el creador del ServiceRelease padre (A6).
    """
    updated = await etapa_release_svc.aprobar(
        db,
        id,
        aprobador_id=current_user.id,
        notas=body.notas,
    )
    if not updated:
        raise NotFoundException("Etapa no encontrada")
    return success(EtapaReleaseRead.model_validate(updated).model_dump(mode="json"))


@router.post("/{id}/rechazar")
async def rechazar_etapa(
    id: UUID,
    body: EtapaRechazarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.RELEASES.APPROVE)),
):
    """Rechaza una etapa. Justificación obligatoria (A1) — min 10 chars.

    Si la ReglaSoD 'release.aprobar' está activa, aplica SoD (A6).
    """
    updated = await etapa_release_svc.rechazar(
        db,
        id,
        aprobador_id=current_user.id,
        justificacion=body.justificacion,
        notas=body.notas,
    )
    if not updated:
        raise NotFoundException("Etapa no encontrada")
    return success(EtapaReleaseRead.model_validate(updated).model_dump(mode="json"))
