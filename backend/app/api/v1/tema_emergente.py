"""TemaEmergente CRUD endpoints."""

from __future__ import annotations

import csv
import hashlib
from io import StringIO

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_permission
from app.api.deps_ownership import require_ownership
from app.core.permissions import P
from app.core.response import success
from app.models.user import User
from app.models.tema_emergente import TemaEmergente
from app.schemas.tema_emergente import TemaEmergenteCreate, TemaEmergenteRead, TemaEmergenteUpdate
from app.services.audit_service import record as audit_record
from app.services.tema_emergente_service import tema_emergente_svc

router = APIRouter()


@router.get("/export.csv")
async def export_temas_emergentes_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Exporta temas emergentes a CSV; auditoría A7."""
    items = await tema_emergente_svc.list(db, filters={"user_id": current_user.id})
    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        ["id", "titulo", "tipo", "estado", "impacto", "fuente", "celula_id"]
    )
    for t in items:
        writer.writerow(
            [
                str(t.id),
                t.titulo,
                t.tipo,
                t.estado,
                t.impacto,
                t.fuente,
                str(t.celula_id) if t.celula_id else "",
            ]
        )
    body = buf.getvalue()
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    await audit_record(
        db,
        action="tema_emergente.export_csv",
        entity_type="tema_emergente",
        entity_id=current_user.id,
        metadata={"rows": len(items), "sha256": digest, "format": "csv"},
    )
    return Response(
        content=body,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="temas_emergentes.csv"'},
    )


@router.get("")
async def list_temas_emergentes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = 1,
    page_size: int = 50,
):
    """List temas emergentes owned by the current user (paginated)."""
    from sqlalchemy import select, func
    from app.core.response import paginated

    # Get paginated items
    stmt = select(TemaEmergente).where(
        TemaEmergente.user_id == current_user.id,
        TemaEmergente.deleted_at.is_(None),
    ).order_by(TemaEmergente.created_at.desc())

    # Apply pagination
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    # Get total count
    count_stmt = select(func.count(TemaEmergente.id)).where(
        TemaEmergente.user_id == current_user.id,
        TemaEmergente.deleted_at.is_(None),
    )
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one_or_none() or 0

    return paginated(
        [TemaEmergenteRead.model_validate(x).model_dump(mode="json") for x in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/{id}")
async def get_tema_emergente(
    entity: TemaEmergente = Depends(require_ownership(tema_emergente_svc)),
):
    """Get a single owned tema emergente by ID (404 if not owned)."""
    return success(TemaEmergenteRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_tema_emergente(
    entity_in: TemaEmergenteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new tema emergente for the current user."""
    entity = await tema_emergente_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(TemaEmergenteRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_tema_emergente(
    entity_in: TemaEmergenteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: TemaEmergente = Depends(require_ownership(tema_emergente_svc)),
):
    """Partially update an owned tema emergente (404 if not owned)."""
    updated = await tema_emergente_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(TemaEmergenteRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_tema_emergente(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: TemaEmergente = Depends(require_ownership(tema_emergente_svc)),
):
    """Delete an owned tema emergente (404 if not owned)."""
    await tema_emergente_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "TemaEmergente deleted"})
