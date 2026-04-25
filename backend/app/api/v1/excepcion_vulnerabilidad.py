"""ExcepcionVulnerabilidad endpoints — CRUD + flujo de aprobación con SoD (A6)."""

from __future__ import annotations

import csv
import hashlib
from io import StringIO
from uuid import UUID

from fastapi import APIRouter, Body, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_permission
from app.api.deps_ownership import require_ownership
from app.core.exceptions import NotFoundException
from app.core.permissions import P
from app.core.response import success
from app.models.excepcion_vulnerabilidad import ExcepcionVulnerabilidad
from app.models.user import User
from app.schemas.excepcion_vulnerabilidad import (
    ExcepcionVulnerabilidadCreate,
    ExcepcionVulnerabilidadRead,
    ExcepcionVulnerabilidadUpdate,
)
from app.services.audit_service import record as audit_record
from app.services.excepcion_vulnerabilidad_service import excepcion_vulnerabilidad_svc

router = APIRouter()


@router.get("/export.csv")
async def export_excepciones_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Exporta excepciones del usuario a CSV y registra auditoría A7."""
    items = await excepcion_vulnerabilidad_svc.list(
        db, filters={"user_id": current_user.id}
    )
    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        ["id", "vulnerabilidad_id", "estado", "justificacion", "fecha_limite", "created_at"]
    )
    for item in items:
        writer.writerow(
            [
                str(item.id),
                str(item.vulnerabilidad_id),
                item.estado,
                item.justificacion,
                item.fecha_limite.isoformat() if item.fecha_limite else "",
                item.created_at.isoformat() if item.created_at else "",
            ]
        )
    body = buf.getvalue()
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    await audit_record(
        db,
        action="excepcion_vulnerabilidad.export_csv",
        entity_type="excepcion_vulnerabilidad",
        entity_id=current_user.id,
        metadata={"rows": len(items), "sha256": digest, "format": "csv"},
    )
    return Response(
        content=body,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="excepciones_vulnerabilidad.csv"'},
    )


@router.get("")
async def list_excepciones(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista excepciones de vulnerabilidad del usuario actual."""
    items = await excepcion_vulnerabilidad_svc.list(db, filters={"user_id": current_user.id})
    return success([ExcepcionVulnerabilidadRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_excepcion(
    entity: ExcepcionVulnerabilidad = Depends(require_ownership(excepcion_vulnerabilidad_svc)),
):
    """Obtiene una excepción por ID (404 si no existe o no es del usuario)."""
    return success(ExcepcionVulnerabilidadRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_excepcion(
    entity_in: ExcepcionVulnerabilidadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea una nueva solicitud de excepción. Estado inicial: Pendiente.

    Requiere justificacion (mínimo 10 caracteres) — regla A1.
    """
    entity = await excepcion_vulnerabilidad_svc.create(
        db, entity_in, extra={"user_id": current_user.id, "estado": "Pendiente"}
    )
    return success(ExcepcionVulnerabilidadRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_excepcion(
    entity_in: ExcepcionVulnerabilidadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ExcepcionVulnerabilidad = Depends(require_ownership(excepcion_vulnerabilidad_svc)),
):
    """Actualiza parcialmente una excepción (solo mientras está Pendiente)."""
    updated = await excepcion_vulnerabilidad_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(ExcepcionVulnerabilidadRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_excepcion(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ExcepcionVulnerabilidad = Depends(require_ownership(excepcion_vulnerabilidad_svc)),
):
    """Soft-delete de una excepción (A2)."""
    await excepcion_vulnerabilidad_svc.delete(
        db, entity.id, scope={"user_id": current_user.id}, actor_id=current_user.id
    )
    return success(None, meta={"message": "ExcepcionVulnerabilidad eliminada"})


# ── Flujo de aprobación SoD (A6) ──────────────────────────────────────────────

@router.post("/{id}/aprobar")
async def aprobar_excepcion(
    id: UUID,
    notas: str | None = Body(None, embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.VULNERABILITIES.APPROVE)),
):
    """Aprueba una excepción pendiente.

    SoD (A6): si la regla 'vulnerabilidad.aprobar_excepcion' está activa,
    el aprobador no puede ser el mismo que solicitó la excepción.
    """
    result = await excepcion_vulnerabilidad_svc.aprobar(
        db, id, aprobador_id=current_user.id, notas=notas
    )
    if not result:
        raise NotFoundException("ExcepcionVulnerabilidad")
    return success(ExcepcionVulnerabilidadRead.model_validate(result).model_dump(mode="json"))


@router.post("/{id}/rechazar")
async def rechazar_excepcion(
    id: UUID,
    notas: str | None = Body(None, embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.VULNERABILITIES.APPROVE)),
):
    """Rechaza una excepción pendiente.

    SoD (A6): si la regla 'vulnerabilidad.aprobar_excepcion' está activa,
    el rechazador no puede ser el mismo que solicitó la excepción.
    """
    result = await excepcion_vulnerabilidad_svc.rechazar(
        db, id, aprobador_id=current_user.id, notas=notas
    )
    if not result:
        raise NotFoundException("ExcepcionVulnerabilidad")
    return success(ExcepcionVulnerabilidadRead.model_validate(result).model_dump(mode="json"))
