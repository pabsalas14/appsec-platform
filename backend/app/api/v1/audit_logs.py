"""Admin-only audit log browser.

Read-only endpoint — rows are written by ``BaseService`` / ``audit_service``;
this module just exposes them to administrators with filtering + pagination.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.core.response import paginated
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogRead

router = APIRouter()


@router.get("")
async def list_audit_logs(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
    actor_user_id: uuid.UUID | None = Query(
        default=None, description="Filter by actor"
    ),
    action: str | None = Query(default=None, description="Exact action match"),
    entity_type: str | None = Query(default=None),
    since: datetime | None = Query(default=None),
    until: datetime | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
):
    """List audit log entries (admin-only). Supports common filters."""
    filters = []
    if actor_user_id is not None:
        filters.append(AuditLog.actor_user_id == actor_user_id)
    if action is not None:
        filters.append(AuditLog.action == action)
    if entity_type is not None:
        filters.append(AuditLog.entity_type == entity_type)
    if since is not None:
        filters.append(AuditLog.ts >= since)
    if until is not None:
        filters.append(AuditLog.ts <= until)

    count_stmt = select(func.count()).select_from(AuditLog)
    for f in filters:
        count_stmt = count_stmt.where(f)
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = select(AuditLog)
    for f in filters:
        stmt = stmt.where(f)
    stmt = (
        stmt.order_by(AuditLog.ts.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return paginated(
        [AuditLogRead.model_validate(r).model_dump(mode="json") for r in rows],
        page=page,
        page_size=page_size,
        total=int(total),
    )
