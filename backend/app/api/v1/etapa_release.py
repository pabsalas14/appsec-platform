"""EtapaRelease CRUD endpoints + endpoints de aprobación con SoD (A6)."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import error, success
from app.models.etapa_release import EtapaRelease
from app.models.user import User
from app.schemas.etapa_release import (
    EtapaAprobarRequest,
    EtapaRechazarRequest,
    EtapaReleaseCreate,
    EtapaReleaseRead,
    EtapaReleaseUpdate,
)
from app.services.etapa_release_service import etapa_release_svc

router = APIRouter()


@router.get("")
async def list_etapa_releases(
    service_release_id: Optional[UUID] = Query(default=None),
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
    body: EtapaAprobarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: EtapaRelease = Depends(require_ownership(etapa_release_svc)),
):
    """Aprueba una etapa.

    Si la ReglaSoD 'release.aprobar' está activa, el aprobador no puede ser
    el creador del ServiceRelease padre (A6).
    """
    updated = await etapa_release_svc.aprobar(
        db,
        entity.id,
        aprobador_id=current_user.id,
        notas=body.notas,
        scope={"user_id": current_user.id},
    )
    if not updated:
        return error("Etapa no encontrada", status_code=404)
    return success(EtapaReleaseRead.model_validate(updated).model_dump(mode="json"))


@router.post("/{id}/rechazar")
async def rechazar_etapa(
    body: EtapaRechazarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: EtapaRelease = Depends(require_ownership(etapa_release_svc)),
):
    """Rechaza una etapa. Justificación obligatoria (A1) — min 10 chars.

    Si la ReglaSoD 'release.aprobar' está activa, aplica SoD (A6).
    """
    updated = await etapa_release_svc.rechazar(
        db,
        entity.id,
        aprobador_id=current_user.id,
        justificacion=body.justificacion,
        notas=body.notas,
        scope={"user_id": current_user.id},
    )
    if not updated:
        return error("Etapa no encontrada", status_code=404)
    return success(EtapaReleaseRead.model_validate(updated).model_dump(mode="json"))
