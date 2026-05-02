"""Historial de envío de correos (auditoría S18) — solo backoffice."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.logging import logger
from app.core.response import success
from app.models.email_log import EmailLog
from app.models.user import User

router = APIRouter()


def _map_estado(estado: str) -> str:
    return {"pendiente": "pending", "enviado": "sent", "fallido": "failed"}.get(estado, "pending")


@router.get("")
async def list_email_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
    limit: int = Query(50, ge=1, le=200),
):
    """Lista intentos de correo recientes (tabla `email_logs`)."""
    logger.info(
        "email_logs.list",
        extra={"event": "email_logs.list", "user_id": str(current_user.id), "limit": limit},
    )
    stmt = select(EmailLog).order_by(EmailLog.created_at.desc()).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    data = [
        {
            "id": str(r.id),
            "user_id": str(r.user_id),
            "notification_type": "email",
            "subject": r.asunto,
            "recipient_email": r.destinatario,
            "status": _map_estado(str(r.estado)),
            "retry_count": r.reintentos,
            "error_message": r.error_mensaje,
            "created_at": r.created_at.isoformat(),
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in rows
    ]
    return success(data)
