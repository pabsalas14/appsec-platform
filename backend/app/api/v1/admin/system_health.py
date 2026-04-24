"""System Health Dashboard (T4) — super_admin only.

Provides operational health metrics:
- Database table sizes and growth
- Active users and sessions
- Recent audit log activity
- API error rates (from audit logs)
- IA integration status (placeholder until M13)
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.core.response import success
from app.models.audit_log import AuditLog
from app.models.user import User

router = APIRouter()


@router.get("")
async def system_health(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("super_admin", "admin")),
):
    """System health overview — super_admin only."""
    now = datetime.now(timezone.utc)

    # ── Active users (logged in within last 24h based on audit logs) ──
    since_24h = now - timedelta(hours=24)
    active_users = int(
        (
            await db.execute(
                select(func.count(func.distinct(AuditLog.actor_user_id)))
                .where(AuditLog.ts >= since_24h)
            )
        ).scalar_one() or 0
    )

    total_users = int(
        (
            await db.execute(
                select(func.count()).select_from(User).where(User.is_active.is_(True))
            )
        ).scalar_one() or 0
    )

    # ── Audit log stats ──
    total_audit_entries = int(
        (
            await db.execute(select(func.count()).select_from(AuditLog))
        ).scalar_one() or 0
    )

    since_1h = now - timedelta(hours=1)
    recent_errors = int(
        (
            await db.execute(
                select(func.count())
                .select_from(AuditLog)
                .where(
                    AuditLog.ts >= since_1h,
                    AuditLog.action.like("%.error%"),
                )
            )
        ).scalar_one() or 0
    )

    # ── Database size (pg_database_size) ──
    db_size_result = await db.execute(
        text("SELECT pg_database_size(current_database())")
    )
    db_size_bytes = int(db_size_result.scalar_one() or 0)
    db_size_mb = round(db_size_bytes / (1024 * 1024), 2)

    # ── Table row counts for key tables ──
    key_tables = [
        "users", "audit_logs", "vulnerabilidads",
        "service_releases", "changelog_entradas",
    ]
    table_stats = []
    for table_name in key_tables:
        try:
            count_result = await db.execute(
                text(f"SELECT COUNT(*) FROM {table_name}")  # noqa: S608
            )
            table_stats.append({
                "table": table_name,
                "row_count": int(count_result.scalar_one() or 0),
            })
        except Exception:
            table_stats.append({
                "table": table_name,
                "row_count": -1,
                "error": "table_not_found",
            })

    # ── IA integration status (placeholder until M13 ConfiguracionIA) ──
    ia_status = {
        "provider": "unconfigured",
        "status": "untested",
        "last_call": None,
    }

    return success({
        "timestamp": now.isoformat(),
        "users": {
            "total_active": total_users,
            "active_last_24h": active_users,
        },
        "audit": {
            "total_entries": total_audit_entries,
            "errors_last_hour": recent_errors,
        },
        "database": {
            "size_mb": db_size_mb,
            "table_stats": table_stats,
        },
        "ia_integration": ia_status,
        "alerts": [],
    })


@router.post("/refresh")
async def refresh_health(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("super_admin", "admin")),
):
    """Manually trigger a health metrics refresh — super_admin only."""
    # For now returns same as GET; in the future could trigger async jobs
    return await system_health(db=db, _admin=_admin)
