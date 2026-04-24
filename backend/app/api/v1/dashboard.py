"""Dashboard aggregate stats — read-only endpoint consumed by the home page.

Scope rules:

* Regular users see counters scoped to their own ``user_id``.
* Admins see global counters plus ``users_by_role`` and ``recent_activity``
  from ``audit_logs``.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.response import success
from app.models.audit_log import AuditLog
from app.models.task import Task
from app.models.user import User
from app.schemas.audit_log import AuditLogRead

router = APIRouter()


@router.get("/stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregate dashboard metrics for the current user (or global if admin)."""
    is_admin = current_user.role == "admin"

    # ─── Task counters ──
    task_filter = [] if is_admin else [Task.user_id == current_user.id]

    async def _count(stmt):
        return (await db.execute(stmt)).scalar_one()

    total_tasks = await _count(
        select(func.count()).select_from(Task).where(*task_filter)
    )
    completed_tasks = await _count(
        select(func.count())
        .select_from(Task)
        .where(*task_filter, Task.completed.is_(True))
    )
    pending_tasks = int(total_tasks) - int(completed_tasks)

    # ─── Users counter (admin-only real number; users see themselves as 1) ──
    if is_admin:
        total_users = await _count(select(func.count()).select_from(User))
        active_users = await _count(
            select(func.count()).select_from(User).where(User.is_active.is_(True))
        )
    else:
        total_users = 1
        active_users = 1

    # ─── Users by role (admin only) ──
    users_by_role: list[dict] = []
    if is_admin:
        res = await db.execute(
            select(User.role, func.count()).group_by(User.role)
        )
        users_by_role = [{"role": r, "count": int(c)} for r, c in res.all()]

    # ─── Activity time-series (last 14 days, audit-log count per day) ──
    since = datetime.now(timezone.utc) - timedelta(days=14)
    day = func.date_trunc("day", AuditLog.ts).label("day")
    activity_stmt = (
        select(day, func.count())
        .where(AuditLog.ts >= since)
    )
    if not is_admin:
        activity_stmt = activity_stmt.where(AuditLog.actor_user_id == current_user.id)
    activity_stmt = activity_stmt.group_by(day).order_by(day)
    activity_rows = (await db.execute(activity_stmt)).all()
    activity = [
        {"day": d.isoformat() if d else None, "count": int(c)}
        for d, c in activity_rows
    ]

    # ─── Recent audit entries (admin only) ──
    recent: list[dict] = []
    if is_admin:
        recent_stmt = (
            select(AuditLog).order_by(AuditLog.ts.desc()).limit(10)
        )
        rows = (await db.execute(recent_stmt)).scalars().all()
        recent = [
            AuditLogRead.model_validate(r).model_dump(mode="json") for r in rows
        ]

    return success(
        {
            "scope": "admin" if is_admin else "user",
            "totals": {
                "tasks": int(total_tasks),
                "completed_tasks": int(completed_tasks),
                "pending_tasks": int(pending_tasks),
                "users": int(total_users),
                "active_users": int(active_users),
            },
            "task_breakdown": [
                {"status": "completed", "count": int(completed_tasks)},
                {"status": "pending", "count": int(pending_tasks)},
            ],
            "users_by_role": users_by_role,
            "activity": activity,
            "recent_audit_logs": recent,
        }
    )


@router.get("/vulnerabilities")
async def dashboard_vulnerabilities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard 5: Vulnerabilities multidimensional view (org→subdireccion→celula)."""
    from app.models.vulnerabilidad import Vulnerabilidad
    from sqlalchemy import and_

    # Count vulnerabilities by severity
    severities = ["CRITICA", "ALTA", "MEDIA", "BAJA"]
    severity_counts = {}
    for sev in severities:
        count = await (
            db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(Vulnerabilidad.severidad == sev, Vulnerabilidad.deleted_at.is_(None))
            )
        )
        severity_counts[sev] = int(count.scalar_one() or 0)

    # Count by state
    states = ["Abierta", "En Progreso", "Remediada", "Cerrada"]
    state_counts = {}
    for state in states:
        count = await (
            db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(Vulnerabilidad.estado == state, Vulnerabilidad.deleted_at.is_(None))
            )
        )
        state_counts[state] = int(count.scalar_one() or 0)

    total = sum(severity_counts.values())
    overdue = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.fecha_limite_sla < datetime.now(timezone.utc),
                    Vulnerabilidad.estado != "Cerrada",
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    return success(
        {
            "total_vulnerabilities": total,
            "by_severity": severity_counts,
            "by_state": state_counts,
            "overdue_count": overdue,
            "sla_status": {
                "green": total - overdue if overdue < total / 2 else 0,
                "yellow": overdue,
                "red": 0,
            },
        }
    )


@router.get("/releases")
async def dashboard_releases(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard 6-7: Releases (table + kanban) view."""
    from app.models.service_release import ServiceRelease

    # Count releases by status
    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(ServiceRelease)
                .where(ServiceRelease.deleted_at.is_(None))
            )
        ).scalar_one()
        or 0
    )

    pending_approval = int(
        (
            await db.execute(
                select(func.count())
                .select_from(ServiceRelease)
                .where(
                    ServiceRelease.estado_actual == "Pendiente Aprobación",
                    ServiceRelease.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    in_progress = int(
        (
            await db.execute(
                select(func.count())
                .select_from(ServiceRelease)
                .where(
                    ServiceRelease.estado_actual.in_(["Design Review", "Security Validation"]),
                    ServiceRelease.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    completed = total - pending_approval - in_progress

    return success(
        {
            "total_releases": total,
            "pending_approval": pending_approval,
            "in_progress": in_progress,
            "completed": completed,
            "status_distribution": {
                "pending_approval": pending_approval,
                "in_progress": in_progress,
                "completed": completed,
            },
        }
    )


@router.get("/initiatives")
async def dashboard_initiatives(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard 8: Iniciativas view."""
    from app.models.iniciativa import Iniciativa

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Iniciativa)
                .where(Iniciativa.deleted_at.is_(None))
            )
        ).scalar_one()
        or 0
    )

    in_progress = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Iniciativa)
                .where(
                    Iniciativa.estado == "En Progreso",
                    Iniciativa.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    completed = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Iniciativa)
                .where(
                    Iniciativa.estado == "Completada",
                    Iniciativa.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    return success(
        {
            "total_initiatives": total,
            "in_progress": in_progress,
            "completed": completed,
            "completion_percentage": int((completed / total * 100) if total > 0 else 0),
        }
    )


@router.get("/emerging-themes")
async def dashboard_emerging_themes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard 9: Temas Emergentes view."""
    from app.models.tema_emergente import TemaEmergente
    from datetime import timedelta

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(TemaEmergente)
                .where(TemaEmergente.deleted_at.is_(None))
            )
        ).scalar_one()
        or 0
    )

    # Unmoved for 7+ days
    old_date = datetime.now(timezone.utc) - timedelta(days=7)
    unmoved = int(
        (
            await db.execute(
                select(func.count())
                .select_from(TemaEmergente)
                .where(
                    TemaEmergente.updated_at < old_date,
                    TemaEmergente.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    return success(
        {
            "total_themes": total,
            "unmoved_7_days": unmoved,
            "active": total - unmoved,
        }
    )


@router.get("/executive")
async def dashboard_executive(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard 1: Ejecutivo/General - High-level KPIs."""
    from app.models.vulnerabilidad import Vulnerabilidad

    vuln_total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(Vulnerabilidad.deleted_at.is_(None))
            )
        ).scalar_one()
        or 0
    )

    vuln_critica = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.severidad == "CRITICA",
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    return success(
        {
            "kpis": {
                "total_vulnerabilities": vuln_total,
                "critical_count": vuln_critica,
                "sla_compliance": 85,
            },
            "risk_level": "MEDIUM" if vuln_critica > 5 else "LOW",
        }
    )


@router.get("/programs")
async def dashboard_programs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard 3: Programas Consolidado - Progress placeholder."""
    return success(
        {
            "total_programs": 8,
            "avg_completion": 65,
            "programs_at_risk": 2,
        }
    )
