"""ServiceRelease CRUD endpoints (Módulo 8 — Operación)."""

from __future__ import annotations

import csv
import hashlib
from datetime import datetime
from io import StringIO
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_permission
from app.api.deps_ownership import require_ownership
from app.core.permissions import P
from app.core.response import success
from app.models.service_release import ServiceRelease
from app.models.user import User
from app.schemas.service_release import (
    ServiceReleaseCreate,
    ServiceReleaseRead,
    ServiceReleaseUpdate,
)
from app.services.audit_service import record as audit_record
from app.services.json_setting import get_json_setting
from app.services.service_release_service import service_release_svc

router = APIRouter()


@router.get("/config/operacion")
async def get_service_release_operacion_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """C1-C3: transiciones, orden kanban y ajuste de flujo (lectura) desde system_settings."""
    tr = await get_json_setting(db, "flujo.transiciones_liberacion", None)
    kn = await get_json_setting(db, "kanban.liberacion", None)
    return success(
        {
            "transiciones": tr if isinstance(tr, dict) else {},
            "kanban": kn if isinstance(kn, dict) else {},
        }
    )


@router.get("/export.csv")
async def export_service_releases_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.RELEASES.EXPORT)),
):
    """Exporta releases del usuario a CSV y registra auditoría A7."""
    items = await service_release_svc.list(db, filters={"user_id": current_user.id})
    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "nombre", "version", "estado_actual", "jira_referencia", "servicio_id"])
    for rel in items:
        writer.writerow(
            [
                str(rel.id),
                rel.nombre,
                rel.version,
                rel.estado_actual,
                rel.jira_referencia or "",
                str(rel.servicio_id),
            ]
        )
    body = buf.getvalue()
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    await audit_record(
        db,
        action="service_release.export_csv",
        entity_type="service_release",
        entity_id=current_user.id,
        metadata={"rows": len(items), "sha256": digest, "format": "csv"},
    )
    return Response(
        content=body,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="service_releases.csv"'},
    )


@router.get("")
async def list_service_releases(
    servicio_id: UUID | None = Query(default=None),
    estado_actual: str | None = Query(default=None, max_length=120),
    jira: str | None = Query(
        default=None,
        max_length=255,
        description="Búsqueda parcial (referencia Jira).",
    ),
    creado_desde: datetime | None = Query(default=None),
    creado_hasta: datetime | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista releases del usuario. Filtros §13.2 (liberaciones flujo)."""
    from sqlalchemy import and_

    from app.models.service_release import ServiceRelease

    cond = [
        ServiceRelease.user_id == current_user.id,
        ServiceRelease.deleted_at.is_(None),
    ]
    if servicio_id:
        cond.append(ServiceRelease.servicio_id == servicio_id)
    if estado_actual:
        cond.append(ServiceRelease.estado_actual == estado_actual)
    if jira and jira.strip():
        cond.append(ServiceRelease.jira_referencia.ilike(f"%{jira.strip()}%"))
    if creado_desde is not None:
        cond.append(ServiceRelease.created_at >= creado_desde)
    if creado_hasta is not None:
        cond.append(ServiceRelease.created_at <= creado_hasta)
    res = await db.execute(select(ServiceRelease).where(and_(*cond)).order_by(ServiceRelease.created_at.desc()))
    items = res.scalars().all()
    return success([ServiceReleaseRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_service_release(
    entity: ServiceRelease = Depends(require_ownership(service_release_svc)),
):
    """Obtiene un release por ID (404 si no pertenece al usuario)."""
    return success(ServiceReleaseRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_service_release(
    entity_in: ServiceReleaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea un nuevo ServiceRelease para el usuario autenticado."""
    entity = await service_release_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(ServiceReleaseRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_service_release(
    entity_in: ServiceReleaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ServiceRelease = Depends(require_ownership(service_release_svc)),
):
    """Actualiza parcialmente un release (404 si no es del usuario)."""
    updated = await service_release_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(ServiceReleaseRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_service_release(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ServiceRelease = Depends(require_ownership(service_release_svc)),
):
    """Elimina (soft-delete) un release (404 si no es del usuario)."""
    await service_release_svc.delete(db, entity.id, scope={"user_id": current_user.id}, actor_id=current_user.id)
    return success(None, meta={"message": "ServiceRelease eliminado"})
