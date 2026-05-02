"""PlanRemediacion CRUD endpoints."""

from __future__ import annotations

import uuid
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import delete, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.exceptions import NotFoundException
from app.core.response import success
from app.models.plan_remediacion import PlanRemediacion, plan_remediacion_vulnerabilidads
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad
from app.schemas.plan_remediacion import PlanRemediacionCreate, PlanRemediacionRead, PlanRemediacionUpdate
from app.services.plan_remediacion_service import plan_remediacion_svc
from app.services.vulnerabilidad_service import vulnerabilidad_svc

router = APIRouter()


class LinkVulnBody(BaseModel):
    vulnerabilidad_id: UUID = Field(..., description="Hallazgo a vincular al plan")


async def _linked_vuln_ids(db: AsyncSession, plan_id: uuid.UUID) -> list[uuid.UUID]:
    r = await db.execute(
        select(plan_remediacion_vulnerabilidads.c.vulnerabilidad_id).where(
            plan_remediacion_vulnerabilidads.c.plan_remediacion_id == plan_id
        )
    )
    return [row[0] for row in r.all()]


@router.get("")
async def list_plan_remediaciones(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List plan remediaciones owned by the current user."""
    items = await plan_remediacion_svc.list(db, filters={"user_id": current_user.id})
    out: list[dict] = []
    for x in items:
        row = PlanRemediacionRead.model_validate(x).model_dump(mode="json")
        row["vulnerabilidad_ids"] = []
        out.append(row)
    return success(out)


@router.get("/{id}/vulnerabilidades")
async def list_plan_vulnerabilidades(
    db: AsyncSession = Depends(get_db),
    entity: PlanRemediacion = Depends(require_ownership(plan_remediacion_svc)),
):
    """Hallazgos vinculados al plan (spec 8 — pestaña hallazgos)."""
    stmt = (
        select(Vulnerabilidad)
        .join(
            plan_remediacion_vulnerabilidads,
            Vulnerabilidad.id == plan_remediacion_vulnerabilidads.c.vulnerabilidad_id,
        )
        .where(plan_remediacion_vulnerabilidads.c.plan_remediacion_id == entity.id)
        .where(Vulnerabilidad.deleted_at.is_(None))
    )
    rows = (await db.execute(stmt)).scalars().all()
    data = [
        {
            "id": str(v.id),
            "titulo": v.titulo,
            "severidad": v.severidad,
            "estado": v.estado,
            "fuente": v.fuente,
            "fecha_limite_sla": v.fecha_limite_sla.isoformat() if v.fecha_limite_sla else None,
        }
        for v in rows
    ]
    return success(data)


@router.post("/{id}/vulnerabilidades", status_code=201)
async def link_plan_vulnerabilidad(
    body: LinkVulnBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: PlanRemediacion = Depends(require_ownership(plan_remediacion_svc)),
):
    """Vincula un hallazgo al plan (M:N)."""
    vuln = await vulnerabilidad_svc.get(db, body.vulnerabilidad_id, scope={"user_id": current_user.id})
    if not vuln:
        raise NotFoundException("Vulnerabilidad no encontrada")
    exists = (
        await db.execute(
            select(plan_remediacion_vulnerabilidads.c.vulnerabilidad_id)
            .where(
                plan_remediacion_vulnerabilidads.c.plan_remediacion_id == entity.id,
                plan_remediacion_vulnerabilidads.c.vulnerabilidad_id == body.vulnerabilidad_id,
            )
            .limit(1)
        )
    ).scalar_one_or_none()
    if exists is not None:
        return success({"linked": True})
    await db.execute(
        insert(plan_remediacion_vulnerabilidads).values(
            plan_remediacion_id=entity.id,
            vulnerabilidad_id=body.vulnerabilidad_id,
        )
    )
    await db.flush()
    return success({"linked": True})


@router.delete("/{id}/vulnerabilidades/{vulnerabilidad_id}")
async def unlink_plan_vulnerabilidad(
    vulnerabilidad_id: UUID,
    db: AsyncSession = Depends(get_db),
    entity: PlanRemediacion = Depends(require_ownership(plan_remediacion_svc)),
):
    """Desvincula un hallazgo del plan."""
    await db.execute(
        delete(plan_remediacion_vulnerabilidads).where(
            plan_remediacion_vulnerabilidads.c.plan_remediacion_id == entity.id,
            plan_remediacion_vulnerabilidads.c.vulnerabilidad_id == vulnerabilidad_id,
        )
    )
    await db.flush()
    return success({"unlinked": True})


@router.get("/{id}")
async def get_plan_remediacion(
    db: AsyncSession = Depends(get_db),
    entity: PlanRemediacion = Depends(require_ownership(plan_remediacion_svc)),
):
    """Get a single owned plan remediacion by ID (404 if not owned)."""
    ids = await _linked_vuln_ids(db, entity.id)
    row = PlanRemediacionRead.model_validate(entity).model_copy(update={"vulnerabilidad_ids": ids})
    return success(row.model_dump(mode="json"))


@router.post("", status_code=201)
async def create_plan_remediacion(
    entity_in: PlanRemediacionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new plan remediacion for the current user."""
    entity = await plan_remediacion_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(PlanRemediacionRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_plan_remediacion(
    entity_in: PlanRemediacionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: PlanRemediacion = Depends(require_ownership(plan_remediacion_svc)),
):
    """Partially update an owned plan remediacion (404 if not owned)."""
    updated = await plan_remediacion_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    if updated is None:
        raise NotFoundException("Plan no encontrado")
    ids = await _linked_vuln_ids(db, entity.id)
    row = PlanRemediacionRead.model_validate(updated).model_copy(update={"vulnerabilidad_ids": ids})
    return success(row.model_dump(mode="json"))


@router.delete("/{id}")
async def delete_plan_remediacion(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: PlanRemediacion = Depends(require_ownership(plan_remediacion_svc)),
):
    """Delete an owned plan remediacion (404 if not owned)."""
    await plan_remediacion_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "PlanRemediacion deleted"})
