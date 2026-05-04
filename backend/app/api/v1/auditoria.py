"""Auditoria CRUD endpoints."""

from __future__ import annotations

import csv
import hashlib
from io import StringIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_permission
from app.api.deps_ownership import require_ownership
from app.core.permissions import P
from app.core.response import success
from app.models.auditoria import Auditoria
from app.models.user import User
from app.schemas.auditoria import AuditoriaCreate, AuditoriaRead, AuditoriaUpdate
from app.schemas.notification_preferences import read_prefs_from_user
from app.services.audit_service import record as audit_record
from app.schemas.notificacion import NotificacionCreate
from app.services.auditoria_estados import assert_auditoria_transition_allowed
from app.services.auditoria_service import auditoria_svc
from app.services.notificacion_service import notificacion_svc

router = APIRouter()


@router.get("/export.csv")
async def export_auditorias_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.AUDITS.EXPORT)),
):
    """Exporta auditorías del usuario a CSV; auditoría A7."""
    items = await auditoria_svc.list(db, filters={"user_id": current_user.id})
    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "titulo", "tipo", "estado", "fecha_inicio", "fecha_fin", "alcance"])
    for a in items:
        writer.writerow(
            [
                str(a.id),
                a.titulo,
                a.tipo,
                a.estado,
                a.fecha_inicio.isoformat() if a.fecha_inicio else "",
                a.fecha_fin.isoformat() if a.fecha_fin else "",
                (a.alcance or "")[:2000],
            ]
        )
    body = buf.getvalue()
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    await audit_record(
        db,
        action="auditoria.export_csv",
        entity_type="auditoria",
        entity_id=current_user.id,
        metadata={"rows": len(items), "sha256": digest, "format": "csv"},
    )
    return Response(
        content=body,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="auditorias.csv"'},
    )


@router.get("")
async def list_auditorias(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    estado: str | None = Query(None, max_length=120),
    tipo: str | None = Query(None, max_length=120),
    q: str | None = Query(None, max_length=200, description="Búsqueda en título"),
):
    """List auditorias owned by the current user. Filtros §8 / §13.2."""
    from sqlalchemy import select

    conds = [
        Auditoria.user_id == current_user.id,
        Auditoria.deleted_at.is_(None),
    ]
    if estado and estado.strip():
        conds.append(Auditoria.estado == estado.strip())
    if tipo and tipo.strip():
        conds.append(Auditoria.tipo == tipo.strip())
    if q and q.strip():
        conds.append(Auditoria.titulo.ilike(f"%{q.strip()}%"))
    res = await db.execute(select(Auditoria).where(*conds).order_by(Auditoria.created_at.desc()))
    items = res.scalars().all()
    return success([AuditoriaRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_auditoria(
    entity: Auditoria = Depends(require_ownership(auditoria_svc)),
):
    """Get a single owned auditoria by ID (404 if not owned)."""
    return success(AuditoriaRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_auditoria(
    entity_in: AuditoriaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new auditoria for the current user."""
    entity = await auditoria_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(AuditoriaRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_auditoria(
    entity_in: AuditoriaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: Auditoria = Depends(require_ownership(auditoria_svc)),
):
    """Partially update an owned auditoria (404 if not owned)."""
    if entity_in.estado is not None and entity_in.estado.strip() != (entity.estado or "").strip():
        assert_auditoria_transition_allowed(
            prev_raw=entity.estado or "",
            next_raw=entity_in.estado,
            actor=current_user,
            owner_user_id=entity.user_id,
        )

    prev_estado = entity.estado
    updated = await auditoria_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    if entity_in.estado is not None and (prev_estado or "").strip() != (updated.estado or "").strip():
        owner_row = await db.execute(select(User).where(User.id == entity.user_id))
        owner = owner_row.scalar_one_or_none()
        if owner is None or read_prefs_from_user(owner.preferences).auditoria_estado:
            await notificacion_svc.create(
                db,
                NotificacionCreate(
                    titulo=f"[Auditoría] Cambio de estado: {updated.titulo[:120]}",
                    cuerpo=f"Estado {prev_estado!r} → {updated.estado!r}.",
                    leida=False,
                ),
                extra={"user_id": entity.user_id},
            )
            await db.flush()
    return success(AuditoriaRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_auditoria(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: Auditoria = Depends(require_ownership(auditoria_svc)),
):
    """Delete an owned auditoria (404 if not owned)."""
    await auditoria_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "Auditoria deleted"})
