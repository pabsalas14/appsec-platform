"""AceptacionRiesgo endpoints — CRUD + flujo de aprobación con SoD (A6)."""

from uuid import UUID

from fastapi import APIRouter, Body, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.exceptions import NotFoundException
from app.core.response import success
from app.models.aceptacion_riesgo import AceptacionRiesgo
from app.models.user import User
from app.schemas.aceptacion_riesgo import (
    AceptacionRiesgoCreate,
    AceptacionRiesgoRead,
    AceptacionRiesgoUpdate,
)
from app.services.aceptacion_riesgo_service import aceptacion_riesgo_svc

router = APIRouter()


@router.get("")
async def list_aceptaciones(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista aceptaciones de riesgo del usuario actual."""
    items = await aceptacion_riesgo_svc.list(db, filters={"user_id": current_user.id})
    return success([AceptacionRiesgoRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_aceptacion(
    entity: AceptacionRiesgo = Depends(require_ownership(aceptacion_riesgo_svc)),
):
    """Obtiene una aceptación de riesgo por ID."""
    return success(AceptacionRiesgoRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_aceptacion(
    entity_in: AceptacionRiesgoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registra una aceptación de riesgo. Estado inicial: Pendiente.

    Requiere justificacion_negocio (mínimo 10 caracteres) — regla A1.
    """
    entity = await aceptacion_riesgo_svc.create(
        db, entity_in, extra={"user_id": current_user.id, "estado": "Pendiente"}
    )
    return success(AceptacionRiesgoRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_aceptacion(
    entity_in: AceptacionRiesgoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: AceptacionRiesgo = Depends(require_ownership(aceptacion_riesgo_svc)),
):
    """Actualiza parcialmente una aceptación de riesgo."""
    updated = await aceptacion_riesgo_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(AceptacionRiesgoRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_aceptacion(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: AceptacionRiesgo = Depends(require_ownership(aceptacion_riesgo_svc)),
):
    """Soft-delete de una aceptación de riesgo (A2)."""
    await aceptacion_riesgo_svc.delete(
        db, entity.id, scope={"user_id": current_user.id}, actor_id=current_user.id
    )
    return success(None, meta={"message": "AceptacionRiesgo eliminada"})


# ── Flujo de aprobación SoD (A6) ──────────────────────────────────────────────

@router.post("/{id}/aprobar")
async def aprobar_aceptacion(
    id: UUID,
    notas: str | None = Body(None, embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aprueba una aceptación de riesgo pendiente.

    SoD (A6): si la regla 'vulnerabilidad.aceptar_riesgo' está activa,
    quien registra el riesgo no puede ser quien lo aprueba.
    """
    result = await aceptacion_riesgo_svc.aprobar(
        db, id, aprobador_id=current_user.id, notas=notas
    )
    if not result:
        raise NotFoundException("AceptacionRiesgo")
    return success(AceptacionRiesgoRead.model_validate(result).model_dump(mode="json"))


@router.post("/{id}/rechazar")
async def rechazar_aceptacion(
    id: UUID,
    notas: str | None = Body(None, embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rechaza una aceptación de riesgo pendiente.

    SoD (A6): si la regla 'vulnerabilidad.aceptar_riesgo' está activa,
    quien registra el riesgo no puede ser quien lo rechaza.
    """
    result = await aceptacion_riesgo_svc.rechazar(
        db, id, aprobador_id=current_user.id, notas=notas
    )
    if not result:
        raise NotFoundException("AceptacionRiesgo")
    return success(AceptacionRiesgoRead.model_validate(result).model_dump(mode="json"))
