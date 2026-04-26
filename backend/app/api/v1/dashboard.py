"""Dashboard aggregate stats — read-only endpoint consumed by the home page.

Scope rules:

* Regular users see counters scoped to their own ``user_id``.
* Admins see global counters plus ``users_by_role`` and ``recent_activity``
  from ``audit_logs``.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, case, exists, func, not_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.core.logging import logger
from app.core.permissions import P
from app.core.response import paginated, success
from app.models.audit_log import AuditLog
from app.models.task import Task
from app.models.user import User
from app.schemas.audit_log import AuditLogRead
from app.schemas.service_release import ServiceReleaseUpdate

router = APIRouter()


async def _where_sla_vencido_respet_d2(db: AsyncSession):
    """BRD D2: SLA vencido excluye aceptación de riesgo y excepción vigente aprobada."""
    from app.models.aceptacion_riesgo import AceptacionRiesgo
    from app.models.excepcion_vulnerabilidad import ExcepcionVulnerabilidad
    from app.models.vulnerabilidad import Vulnerabilidad
    from app.services.json_setting import get_json_setting
    from app.services.vulnerabilidad_flujo import estados_activa_clasificacion, parse_estatus_catalog

    now = datetime.now(UTC)
    raw = await get_json_setting(db, "catalogo.estatus_vulnerabilidad", [])
    activa = estados_activa_clasificacion(parse_estatus_catalog(raw))
    base_del = [Vulnerabilidad.deleted_at.is_(None)]
    not_acep = not_(
        exists(
            select(AceptacionRiesgo.id).where(
                AceptacionRiesgo.vulnerabilidad_id == Vulnerabilidad.id,
                AceptacionRiesgo.estado == "Aprobada",
                AceptacionRiesgo.deleted_at.is_(None),
            )
        )
    )
    not_exc = not_(
        exists(
            select(ExcepcionVulnerabilidad.id).where(
                ExcepcionVulnerabilidad.vulnerabilidad_id == Vulnerabilidad.id,
                ExcepcionVulnerabilidad.estado == "Aprobada",
                ExcepcionVulnerabilidad.fecha_limite > now,
                ExcepcionVulnerabilidad.deleted_at.is_(None),
            )
        )
    )
    base = [
        *base_del,
        Vulnerabilidad.fecha_limite_sla.isnot(None),
        Vulnerabilidad.fecha_limite_sla < now,
        not_acep,
        not_exc,
    ]
    if activa:
        base.append(Vulnerabilidad.estado.in_(list(activa)))
    else:
        base.append(Vulnerabilidad.estado != "Cerrada")
    return and_(*base)


def _hierarchy_filter_dict(
    *,
    subdireccion_id: UUID | None,
    gerencia_id: UUID | None,
    organizacion_id: UUID | None,
    celula_id: UUID | None,
) -> dict[str, str]:
    filters: dict[str, str] = {}
    if subdireccion_id:
        filters["subdireccion_id"] = str(subdireccion_id)
    if gerencia_id:
        filters["gerencia_id"] = str(gerencia_id)
    if organizacion_id:
        filters["organizacion_id"] = str(organizacion_id)
    if celula_id:
        filters["celula_id"] = str(celula_id)
    return filters


def _celula_scope_query(
    *,
    subdireccion_id: UUID | None,
    gerencia_id: UUID | None,
    organizacion_id: UUID | None,
    celula_id: UUID | None,
):
    from app.models.celula import Celula
    from app.models.gerencia import Gerencia
    from app.models.organizacion import Organizacion
    from app.models.subdireccion import Subdireccion

    stmt = (
        select(Celula.id)
        .join(Organizacion, Celula.organizacion_id == Organizacion.id)
        .join(Gerencia, Organizacion.gerencia_id == Gerencia.id)
        .join(Subdireccion, Gerencia.subdireccion_id == Subdireccion.id)
        .where(
            Celula.deleted_at.is_(None),
            Organizacion.deleted_at.is_(None),
            Gerencia.deleted_at.is_(None),
            Subdireccion.deleted_at.is_(None),
        )
    )
    if subdireccion_id:
        stmt = stmt.where(Subdireccion.id == subdireccion_id)
    if gerencia_id:
        stmt = stmt.where(Gerencia.id == gerencia_id)
    if organizacion_id:
        stmt = stmt.where(Organizacion.id == organizacion_id)
    if celula_id:
        stmt = stmt.where(Celula.id == celula_id)
    return stmt


def _vulnerability_hierarchy_filter(
    *,
    subdireccion_id: UUID | None,
    gerencia_id: UUID | None,
    organizacion_id: UUID | None,
    celula_id: UUID | None,
):
    from app.models.activo_web import ActivoWeb
    from app.models.aplicacion_movil import AplicacionMovil
    from app.models.repositorio import Repositorio
    from app.models.servicio import Servicio
    from app.models.vulnerabilidad import Vulnerabilidad

    if not any([subdireccion_id, gerencia_id, organizacion_id, celula_id]):
        return None

    celula_scope = _celula_scope_query(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    return or_(
        Vulnerabilidad.servicio_id.in_(select(Servicio.id).where(Servicio.celula_id.in_(celula_scope))),
        Vulnerabilidad.repositorio_id.in_(select(Repositorio.id).where(Repositorio.celula_id.in_(celula_scope))),
        Vulnerabilidad.activo_web_id.in_(select(ActivoWeb.id).where(ActivoWeb.celula_id.in_(celula_scope))),
        Vulnerabilidad.aplicacion_movil_id.in_(
            select(AplicacionMovil.id).where(AplicacionMovil.celula_id.in_(celula_scope))
        ),
    )


def _release_hierarchy_filter(
    *,
    subdireccion_id: UUID | None,
    gerencia_id: UUID | None,
    organizacion_id: UUID | None,
    celula_id: UUID | None,
):
    from app.models.service_release import ServiceRelease
    from app.models.servicio import Servicio

    if not any([subdireccion_id, gerencia_id, organizacion_id, celula_id]):
        return None
    celula_scope = _celula_scope_query(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    return ServiceRelease.servicio_id.in_(select(Servicio.id).where(Servicio.celula_id.in_(celula_scope)))


@router.get("/stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Aggregate dashboard metrics for the current user (or global if admin)."""
    is_admin = current_user.role == "admin"

    # ─── Task counters ──
    task_filter = [] if is_admin else [Task.user_id == current_user.id]

    async def _count(stmt):
        return (await db.execute(stmt)).scalar_one()

    total_tasks = await _count(select(func.count()).select_from(Task).where(*task_filter))
    completed_tasks = await _count(select(func.count()).select_from(Task).where(*task_filter, Task.completed.is_(True)))
    pending_tasks = int(total_tasks) - int(completed_tasks)

    # ─── Users counter (admin-only real number; users see themselves as 1) ──
    if is_admin:
        total_users = await _count(select(func.count()).select_from(User))
        active_users = await _count(select(func.count()).select_from(User).where(User.is_active.is_(True)))
    else:
        total_users = 1
        active_users = 1

    # ─── Users by role (admin only) ──
    users_by_role: list[dict] = []
    if is_admin:
        res = await db.execute(select(User.role, func.count()).group_by(User.role))
        users_by_role = [{"role": r, "count": int(c)} for r, c in res.all()]

    # ─── Activity time-series (last 14 days, audit-log count per day) ──
    since = datetime.now(UTC) - timedelta(days=14)
    day = func.date_trunc("day", AuditLog.ts).label("day")
    activity_stmt = select(day, func.count()).where(AuditLog.ts >= since)
    if not is_admin:
        activity_stmt = activity_stmt.where(AuditLog.actor_user_id == current_user.id)
    activity_stmt = activity_stmt.group_by(day).order_by(day)
    activity_rows = (await db.execute(activity_stmt)).all()
    activity = [{"day": d.isoformat() if d else None, "count": int(c)} for d, c in activity_rows]

    # ─── Recent audit entries (admin only) ──
    recent: list[dict] = []
    if is_admin:
        recent_stmt = select(AuditLog).order_by(AuditLog.ts.desc()).limit(10)
        rows = (await db.execute(recent_stmt)).scalars().all()
        recent = [AuditLogRead.model_validate(r).model_dump(mode="json") for r in rows]

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
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 5: Vulnerabilities multidimensional view (org→subdireccion→celula)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    # Count vulnerabilities by severity
    severities = ["CRITICA", "ALTA", "MEDIA", "BAJA"]
    severity_counts = {}
    for sev in severities:
        count = await db.execute(
            select(func.count())
            .select_from(Vulnerabilidad)
            .where(
                Vulnerabilidad.severidad == sev,
                Vulnerabilidad.deleted_at.is_(None),
                *([hierarchy_filter] if hierarchy_filter is not None else []),
            )
        )
        severity_counts[sev] = int(count.scalar_one() or 0)

    # Count by state
    states = ["Abierta", "En Progreso", "Remediada", "Cerrada"]
    state_counts = {}
    for state in states:
        count = await db.execute(
            select(func.count())
            .select_from(Vulnerabilidad)
            .where(
                Vulnerabilidad.estado == state,
                Vulnerabilidad.deleted_at.is_(None),
                *([hierarchy_filter] if hierarchy_filter is not None else []),
            )
        )
        state_counts[state] = int(count.scalar_one() or 0)

    total = sum(severity_counts.values())
    sla_d2 = await _where_sla_vencido_respet_d2(db)
    overdue = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    sla_d2,
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
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
            "applied_filters": _hierarchy_filter_dict(
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=organizacion_id,
                celula_id=celula_id,
            ),
        }
    )


@router.get("/releases")
async def dashboard_releases(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 6-7: Releases (table + kanban) view."""
    from app.models.service_release import ServiceRelease

    hierarchy_filter = _release_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    # Count releases by status
    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(ServiceRelease)
                .where(
                    ServiceRelease.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
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
                    or_(
                        ServiceRelease.estado_actual == "Pendiente Aprobación",
                        ServiceRelease.estado_actual == "Pendiente de Aprobacion",
                    ),
                    ServiceRelease.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
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
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
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
            "applied_filters": _hierarchy_filter_dict(
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=organizacion_id,
                celula_id=celula_id,
            ),
        }
    )


@router.get("/initiatives")
async def dashboard_initiatives(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 8: Iniciativas view."""
    from app.models.iniciativa import Iniciativa

    filters = [Iniciativa.deleted_at.is_(None)]
    if any([subdireccion_id, gerencia_id, organizacion_id, celula_id]):
        celula_scope = _celula_scope_query(
            subdireccion_id=subdireccion_id,
            gerencia_id=gerencia_id,
            organizacion_id=organizacion_id,
            celula_id=celula_id,
        )
        filters.append(Iniciativa.celula_id.in_(celula_scope))

    total = int((await db.execute(select(func.count()).select_from(Iniciativa).where(*filters))).scalar_one() or 0)

    in_progress = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Iniciativa)
                .where(
                    Iniciativa.estado == "En Progreso",
                    *filters,
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
                    *filters,
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
            "applied_filters": _hierarchy_filter_dict(
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=organizacion_id,
                celula_id=celula_id,
            ),
        }
    )


@router.get("/emerging-themes")
async def dashboard_emerging_themes(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 9: Temas Emergentes view."""
    from datetime import timedelta

    from app.models.tema_emergente import TemaEmergente

    filters = [TemaEmergente.deleted_at.is_(None)]
    if any([subdireccion_id, gerencia_id, organizacion_id, celula_id]):
        celula_scope = _celula_scope_query(
            subdireccion_id=subdireccion_id,
            gerencia_id=gerencia_id,
            organizacion_id=organizacion_id,
            celula_id=celula_id,
        )
        filters.append(TemaEmergente.celula_id.in_(celula_scope))

    total = int((await db.execute(select(func.count()).select_from(TemaEmergente).where(*filters))).scalar_one() or 0)

    # Unmoved for 7+ days
    old_date = datetime.now(UTC) - timedelta(days=7)
    unmoved = int(
        (
            await db.execute(
                select(func.count())
                .select_from(TemaEmergente)
                .where(
                    TemaEmergente.updated_at < old_date,
                    *filters,
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
            "applied_filters": _hierarchy_filter_dict(
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=organizacion_id,
                celula_id=celula_id,
            ),
        }
    )


@router.get("/executive")
async def dashboard_executive(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 1: Ejecutivo/General - Comprehensive KPIs + Trends + Top Repos + SLA + Audits."""
    from app.models.auditoria import Auditoria
    from app.models.hallazgo_auditoria import HallazgoAuditoria
    from app.models.repositorio import Repositorio
    from app.models.service_release import ServiceRelease
    from app.models.tema_emergente import TemaEmergente
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.executive.view", extra={"event": "dashboard.executive.view"})

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )

    # ─── 1. KPIS ────────────────────────────────────────────────────────────
    sev_conds = [
        Vulnerabilidad.deleted_at.is_(None),
        *([hierarchy_filter] if hierarchy_filter is not None else []),
    ]

    # Program advancement (by fuente)
    prog_rows = (
        await db.execute(
            select(Vulnerabilidad.fuente, func.count().label("total"))
            .where(Vulnerabilidad.deleted_at.is_(None), *([hierarchy_filter] if hierarchy_filter is not None else []))
            .group_by(Vulnerabilidad.fuente)
        )
    ).all()
    programs_advancement = 0
    if prog_rows:
        total_prog = sum(int(t) for _, t in prog_rows)
        programs_advancement = 50 if total_prog > 0 else 0

    # Critical vulns
    vuln_critica = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    func.lower(Vulnerabilidad.severidad) == "critica",
                    *sev_conds,
                )
            )
        ).scalar_one()
        or 0
    )

    # Active releases
    release_filter = _release_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    active_releases = int(
        (
            await db.execute(
                select(func.count())
                .select_from(ServiceRelease)
                .where(
                    ServiceRelease.deleted_at.is_(None),
                    ServiceRelease.estado_actual.in_(
                        ["Design Review", "Security Validation", "En Ejecución", "Pendiente Aprobación"]
                    ),
                    *([release_filter] if release_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )

    # Emerging themes
    emerging_themes = int(
        (
            await db.execute(
                select(func.count())
                .select_from(TemaEmergente)
                .where(TemaEmergente.deleted_at.is_(None))
            )
        ).scalar_one()
        or 0
    )

    # Audits
    audits_count = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Auditoria)
                .where(Auditoria.deleted_at.is_(None))
            )
        ).scalar_one()
        or 0
    )

    # ─── 2. SECURITY POSTURE (6 months trend) ────────────────────────────────
    now = datetime.now(UTC)
    trend_data = []
    for days_back in range(180, 0, -30):
        start_date = now - timedelta(days=days_back)
        end_date = now - timedelta(days=max(0, days_back - 30))
        month_label = start_date.strftime("%b %Y")

        criticas = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        func.lower(Vulnerabilidad.severidad) == "critica",
                        Vulnerabilidad.created_at >= start_date,
                        Vulnerabilidad.created_at <= end_date,
                        Vulnerabilidad.deleted_at.is_(None),
                        *([hierarchy_filter] if hierarchy_filter is not None else []),
                    )
                )
            ).scalar_one()
            or 0
        )
        altas = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        func.lower(Vulnerabilidad.severidad) == "alta",
                        Vulnerabilidad.created_at >= start_date,
                        Vulnerabilidad.created_at <= end_date,
                        Vulnerabilidad.deleted_at.is_(None),
                        *([hierarchy_filter] if hierarchy_filter is not None else []),
                    )
                )
            ).scalar_one()
            or 0
        )
        medias = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        func.lower(Vulnerabilidad.severidad) == "media",
                        Vulnerabilidad.created_at >= start_date,
                        Vulnerabilidad.created_at <= end_date,
                        Vulnerabilidad.deleted_at.is_(None),
                        *([hierarchy_filter] if hierarchy_filter is not None else []),
                    )
                )
            ).scalar_one()
            or 0
        )
        bajas = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        func.lower(Vulnerabilidad.severidad) == "baja",
                        Vulnerabilidad.created_at >= start_date,
                        Vulnerabilidad.created_at <= end_date,
                        Vulnerabilidad.deleted_at.is_(None),
                        *([hierarchy_filter] if hierarchy_filter is not None else []),
                    )
                )
            ).scalar_one()
            or 0
        )

        trend_data.append(
            {
                "name": month_label,
                "criticas": criticas,
                "altas": altas,
                "medias": medias,
                "bajas": bajas,
            }
        )

    # Security posture percentage
    total_vulns = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )
    security_posture = 100 - int((vuln_critica / total_vulns * 100)) if total_vulns > 0 else 100

    # ─── 3. TOP 5 REPOS WITH CRITICAL VULNS ───────────────────────────────────
    top_repos = (
        await db.execute(
            select(
                Repositorio.nombre,
                func.count().label("count"),
            )
            .join(Vulnerabilidad, Vulnerabilidad.repositorio_id == Repositorio.id)
            .where(
                func.lower(Vulnerabilidad.severidad) == "critica",
                Vulnerabilidad.deleted_at.is_(None),
                Repositorio.deleted_at.is_(None),
                *([hierarchy_filter] if hierarchy_filter is not None else []),
            )
            .group_by(Repositorio.id, Repositorio.nombre)
            .order_by(func.count().desc())
            .limit(5)
        )
    ).all()

    top_repos_result = [
        {
            "label": nombre,
            "value": int(count),
            "color": "#ef4444" if int(count) > 10 else "#f97316",
        }
        for nombre, count in top_repos
    ]

    # ─── 4. SLA STATUS (SEMÁFORO) ──────────────────────────────────────────────
    sla_d2 = await _where_sla_vencido_respet_d2(db)

    overdue_count = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    sla_d2,
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )

    at_risk_count = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.fecha_limite_sla.isnot(None),
                    Vulnerabilidad.fecha_limite_sla > now,
                    Vulnerabilidad.fecha_limite_sla < (now + timedelta(days=3)),
                    Vulnerabilidad.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )

    on_time_count = max(0, total_vulns - overdue_count - at_risk_count)

    total_for_sla = overdue_count + at_risk_count + on_time_count
    sla_status = [
        {
            "status": "ok",
            "label": "A Tiempo",
            "count": on_time_count,
            "percentage": int((on_time_count / total_for_sla * 100)) if total_for_sla > 0 else 0,
        },
        {
            "status": "warning",
            "label": "En Riesgo",
            "count": at_risk_count,
            "percentage": int((at_risk_count / total_for_sla * 100)) if total_for_sla > 0 else 0,
        },
        {
            "status": "critical",
            "label": "Vencido",
            "count": overdue_count,
            "percentage": int((overdue_count / total_for_sla * 100)) if total_for_sla > 0 else 0,
        },
    ]

    # ─── 5. ACTIVE AUDITS ──────────────────────────────────────────────────────
    audit_rows = (
        await db.execute(
            select(Auditoria)
            .where(Auditoria.deleted_at.is_(None))
            .order_by(Auditoria.created_at.desc())
            .limit(5)
        )
    ).scalars().all()

    audits_result = []
    for audit in audit_rows:
        hallazgos_count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(HallazgoAuditoria)
                    .where(
                        HallazgoAuditoria.auditoria_id == audit.id,
                        HallazgoAuditoria.deleted_at.is_(None),
                    )
                )
            ).scalar_one()
            or 0
        )
        audits_result.append(
            {
                "id": str(audit.id),
                "nombre": getattr(audit, "nombre", "Auditoría"),
                "tipo": getattr(audit, "tipo", "Interna"),
                "responsable": getattr(audit, "responsable", "N/A"),
                "fecha": (audit.created_at.isoformat() if audit.created_at else "N/A"),
                "estado": getattr(audit, "estado", "Activa"),
                "hallazgos": hallazgos_count,
            }
        )

    return success(
        {
            "kpis": {
                "programs_advancement": programs_advancement,
                "critical_vulns": vuln_critica,
                "active_releases": active_releases,
                "emerging_themes": emerging_themes,
                "audits": audits_count,
            },
            "security_posture": security_posture,
            "trend_data": trend_data,
            "top_repos": top_repos_result,
            "sla_status": sla_status,
            "audits": audits_result,
        }
    )


@router.get("/programs")
async def dashboard_programs(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 3: Programas consolidado usando datos reales de vulnerabilidades."""
    from app.models.vulnerabilidad import Vulnerabilidad

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    rows = (
        await db.execute(
            select(
                Vulnerabilidad.fuente,
                func.count().label("total"),
                func.sum(case((Vulnerabilidad.estado == "Cerrada", 1), else_=0)).label("closed"),
            )
            .where(
                Vulnerabilidad.deleted_at.is_(None),
                *([hierarchy_filter] if hierarchy_filter is not None else []),
            )
            .group_by(Vulnerabilidad.fuente)
        )
    ).all()

    total_programs = len(rows)
    if total_programs == 0:
        return success(
            {
                "total_programs": 0,
                "avg_completion": 0,
                "programs_at_risk": 0,
                "program_breakdown": [],
                "applied_filters": _hierarchy_filter_dict(
                    subdireccion_id=subdireccion_id,
                    gerencia_id=gerencia_id,
                    organizacion_id=organizacion_id,
                    celula_id=celula_id,
                ),
            }
        )

    breakdown: list[dict] = []
    completion_values: list[int] = []
    at_risk = 0
    for fuente, total, closed in rows:
        total_i = int(total or 0)
        closed_i = int(closed or 0)
        completion = int((closed_i / total_i * 100) if total_i else 0)
        if completion < 60:
            at_risk += 1
        completion_values.append(completion)
        breakdown.append(
            {
                "program": fuente,
                "total_findings": total_i,
                "closed_findings": closed_i,
                "completion_percentage": completion,
            }
        )

    return success(
        {
            "total_programs": total_programs,
            "avg_completion": int(sum(completion_values) / total_programs),
            "programs_at_risk": at_risk,
            "program_breakdown": breakdown,
            "applied_filters": _hierarchy_filter_dict(
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=organizacion_id,
                celula_id=celula_id,
            ),
        }
    )


@router.get("/team")
async def dashboard_team(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 2: Team view by analyst and workload."""
    from app.models.vulnerabilidad import Vulnerabilidad

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    res = await db.execute(
        select(
            Vulnerabilidad.user_id,
            func.count().label("total"),
            func.sum(case((Vulnerabilidad.estado == "Cerrada", 1), else_=0)).label("closed"),
        )
        .where(
            Vulnerabilidad.deleted_at.is_(None),
            *([hierarchy_filter] if hierarchy_filter is not None else []),
        )
        .group_by(Vulnerabilidad.user_id)
    )
    rows = res.all()
    team_items = []
    for user_id, total, closed in rows:
        total_i = int(total or 0)
        closed_i = int(closed or 0)
        team_items.append(
            {
                "user_id": str(user_id),
                "total_vulnerabilities": total_i,
                "open_vulnerabilities": max(total_i - closed_i, 0),
                "closed_vulnerabilities": closed_i,
                "closure_rate": int((closed_i / total_i * 100) if total_i else 0),
            }
        )

    return success(
        {
            "team_size": len(team_items),
            "analysts": team_items,
            "applied_filters": _hierarchy_filter_dict(
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=organizacion_id,
                celula_id=celula_id,
            ),
        }
    )


@router.get("/program-detail")
async def dashboard_program_detail(
    program: str = "sast",
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    """Dashboard 4: Program detail (zoom) by source/motor."""
    from app.models.vulnerabilidad import Vulnerabilidad

    source_map = {
        "sast": "SAST",
        "dast": "DAST",
        "sca": "SCA",
        "tm": "TM",
        "mast": "MAST",
        "auditoria": "Auditoria",
        "terceros": "Tercero",
    }
    source = source_map.get(program.lower(), "SAST")

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.fuente == source,
                    Vulnerabilidad.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )
    closed = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.fuente == source,
                    Vulnerabilidad.estado == "Cerrada",
                    Vulnerabilidad.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )
    open_count = max(total - closed, 0)
    sla_d2 = await _where_sla_vencido_respet_d2(db)
    overdue = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.fuente == source,
                    sla_d2,
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )

    return success(
        {
            "program": program.lower(),
            "source": source,
            "total_findings": total,
            "open_findings": open_count,
            "closed_findings": closed,
            "overdue_findings": overdue,
            "completion_percentage": int((closed / total * 100) if total else 0),
            "applied_filters": _hierarchy_filter_dict(
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=organizacion_id,
                celula_id=celula_id,
            ),
        }
    )


@router.get("/releases-table")
async def dashboard_releases_table(
    limit: int = 50,
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 6: Releases table view."""
    from app.models.service_release import ServiceRelease

    hierarchy_filter = _release_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    rows = (
        (
            await db.execute(
                select(ServiceRelease)
                .where(
                    ServiceRelease.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
                .order_by(ServiceRelease.created_at.desc())
                .limit(max(1, min(limit, 200)))
            )
        )
        .scalars()
        .all()
    )

    return success(
        {
            "items": [
                {
                    "id": str(row.id),
                    "nombre": row.nombre,
                    "version": row.version,
                    "estado_actual": row.estado_actual,
                    "jira_referencia": row.jira_referencia,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                }
                for row in rows
            ],
            "count": len(rows),
            "applied_filters": _hierarchy_filter_dict(
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=organizacion_id,
                celula_id=celula_id,
            ),
        }
    )


@router.get("/releases-kanban")
async def dashboard_releases_kanban(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 7: Releases kanban grouped by status."""
    from app.models.service_release import ServiceRelease

    hierarchy_filter = _release_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    rows = (
        (
            await db.execute(
                select(ServiceRelease)
                .where(
                    ServiceRelease.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
                .order_by(ServiceRelease.created_at.desc())
            )
        )
        .scalars()
        .all()
    )

    board: dict[str, list[dict]] = {}
    for row in rows:
        status = row.estado_actual or "Sin Estado"
        board.setdefault(status, []).append(
            {
                "id": str(row.id),
                "nombre": row.nombre,
                "version": row.version,
            }
        )

    return success(
        {
            "columns": board,
            "total_cards": len(rows),
            "applied_filters": _hierarchy_filter_dict(
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=organizacion_id,
                celula_id=celula_id,
            ),
        }
    )


# ───────────────────────────────────────────────────────────────────────────────
# DASHBOARD 1: EJECUTIVO — 4 NEW ENDPOINTS
# ───────────────────────────────────────────────────────────────────────────────


@router.get("/executive-kpis")
async def dashboard_executive_kpis(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 1: Ejecutivo KPIs aggregation."""
    from app.models.programa_sast import ProgramaSast
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.executive_kpis.view", extra={"event": "dashboard.executive_kpis.view"})

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )

    # Críticas
    vuln_critica = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    func.lower(Vulnerabilidad.severidad) == "critica",
                    Vulnerabilidad.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )

    # Programas (by source)
    prog_rows = (
        await db.execute(
            select(Vulnerabilidad.fuente, func.count().label("total"))
            .where(
                Vulnerabilidad.deleted_at.is_(None),
                *([hierarchy_filter] if hierarchy_filter is not None else []),
            )
            .group_by(Vulnerabilidad.fuente)
        )
    ).all()

    avance_programas = {str(fuente): {"total": int(total)} for fuente, total in prog_rows}

    # Liberaciones
    from app.models.service_release import ServiceRelease

    release_filter = _release_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    liberaciones = int(
        (
            await db.execute(
                select(func.count())
                .select_from(ServiceRelease)
                .where(
                    ServiceRelease.deleted_at.is_(None),
                    *([release_filter] if release_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )

    # Auditorías
    from app.models.auditoria import Auditoria

    auditorias = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Auditoria)
                .where(Auditoria.deleted_at.is_(None))
            )
        ).scalar_one()
        or 0
    )

    # Temas
    from app.models.tema_emergente import TemaEmergente

    temas = int(
        (
            await db.execute(
                select(func.count())
                .select_from(TemaEmergente)
                .where(TemaEmergente.deleted_at.is_(None))
            )
        ).scalar_one()
        or 0
    )

    return success(
        {
            "avance_programas": avance_programas,
            "vulns_criticas": vuln_critica,
            "liberaciones": liberaciones,
            "temas": temas,
            "auditorias": auditorias,
        }
    )


@router.get("/security-posture")
async def dashboard_security_posture(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 1: Security Posture trend (6 meses)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.security_posture.view", extra={"event": "dashboard.security_posture.view"})

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )

    # Current percentage (critica/total)
    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )
    critica = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    func.lower(Vulnerabilidad.severidad) == "critica",
                    Vulnerabilidad.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )

    percentage = (critica / total * 100) if total > 0 else 0

    # Trend: last 6 months
    trend_6_meses = []
    now = datetime.now(UTC)
    for days_back in range(180, 0, -30):
        start_date = now - timedelta(days=days_back)
        end_date = now - timedelta(days=days_back - 30)
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        Vulnerabilidad.created_at >= start_date,
                        Vulnerabilidad.created_at <= end_date,
                        Vulnerabilidad.deleted_at.is_(None),
                        *([hierarchy_filter] if hierarchy_filter is not None else []),
                    )
                )
            ).scalar_one()
            or 0
        )
        trend_6_meses.append({"date": start_date.date().isoformat(), "count": count})

    return success(
        {
            "percentage": float(percentage),
            "trend_6_meses": trend_6_meses,
            "current_critical_count": critica,
            "total_vulnerabilities": total,
        }
    )


@router.get("/top-repos-criticas")
async def dashboard_top_repos_criticas(
    limit: int = Query(5, ge=1, le=100),
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 1: Top 5 repos with critical vulnerabilities."""
    from app.models.repositorio import Repositorio
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.top_repos_criticas.view", extra={"event": "dashboard.top_repos_criticas.view"})

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )

    rows = (
        await db.execute(
            select(
                Repositorio.id,
                Repositorio.nombre,
                func.count().label("count"),
                func.sum(
                    case(
                        (Vulnerabilidad.estado == "Cerrada", 0),
                        else_=1,
                    )
                ).label("open_count"),
            )
            .join(Vulnerabilidad, Vulnerabilidad.repositorio_id == Repositorio.id)
            .where(
                func.lower(Vulnerabilidad.severidad) == "critica",
                Vulnerabilidad.deleted_at.is_(None),
                Repositorio.deleted_at.is_(None),
                *([hierarchy_filter] if hierarchy_filter is not None else []),
            )
            .group_by(Repositorio.id, Repositorio.nombre)
            .order_by(func.count().desc())
            .limit(limit)
        )
    ).all()

    result = []
    for repo_id, nombre, count, open_count in rows:
        open_i = int(open_count or 0)
        count_i = int(count or 0)
        trend = "up" if open_i > count_i * 0.5 else "down"
        result.append(
            {
                "repo": nombre,
                "count": count_i,
                "trend": trend,
            }
        )

    return success(result)


@router.get("/sla-semaforo")
async def dashboard_sla_semaforo(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 1: SLA traffic light (on_time, at_risk, overdue)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.sla_semaforo.view", extra={"event": "dashboard.sla_semaforo.view"})

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )

    now = datetime.now(UTC)
    sla_d2 = await _where_sla_vencido_respet_d2(db)

    # Overdue
    overdue_count = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    sla_d2,
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )

    # At risk (60% to deadline)
    at_risk_count = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.fecha_limite_sla.isnot(None),
                    Vulnerabilidad.fecha_limite_sla > now,
                    Vulnerabilidad.fecha_limite_sla < (now + timedelta(days=3)),
                    Vulnerabilidad.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )

    # On time
    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )
    on_time_count = max(0, total - overdue_count - at_risk_count)

    return success(
        {
            "on_time_count": on_time_count,
            "at_risk_count": at_risk_count,
            "overdue_count": overdue_count,
            "total": total,
        }
    )


# ───────────────────────────────────────────────────────────────────────────────
# DASHBOARD 2: EQUIPO — 2 NEW ENDPOINTS
# ───────────────────────────────────────────────────────────────────────────────


@router.get("/team-summary")
async def dashboard_team_summary(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 2: Team summary (total analysts, workload, avg)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.team_summary.view", extra={"event": "dashboard.team_summary.view"})

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )

    # Distinct analysts
    analyst_rows = (
        await db.execute(
            select(func.count(func.distinct(Vulnerabilidad.user_id)))
            .select_from(Vulnerabilidad)
            .where(
                Vulnerabilidad.deleted_at.is_(None),
                Vulnerabilidad.user_id.isnot(None),
                *([hierarchy_filter] if hierarchy_filter is not None else []),
            )
        )
    ).scalar_one()

    total_analistas = int(analyst_rows or 0)

    # Total assigned
    vulns_asignadas = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.deleted_at.is_(None),
                    Vulnerabilidad.user_id.isnot(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )

    promedio_por_analista = (vulns_asignadas / total_analistas) if total_analistas > 0 else 0

    return success(
        {
            "total_analistas": total_analistas,
            "vulns_asignadas": vulns_asignadas,
            "promedio_por_analista": float(promedio_por_analista),
        }
    )


@router.get("/team-detail/{user_id}")
async def dashboard_team_detail(
    user_id: UUID,
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 2: Team detail for a specific analyst."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.team_detail.view", extra={"event": "dashboard.team_detail.view", "user_id": str(user_id)})

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )

    # Get user
    user_obj = (
        await db.execute(select(User).where(User.id == user_id))
    ).scalars().first()

    if not user_obj:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Get vulnerabilities for this user
    vuln_rows = (
        await db.execute(
            select(Vulnerabilidad)
            .where(
                Vulnerabilidad.user_id == user_id,
                Vulnerabilidad.deleted_at.is_(None),
                *([hierarchy_filter] if hierarchy_filter is not None else []),
            )
            .order_by(Vulnerabilidad.created_at.desc())
            .limit(100)
        )
    ).scalars().all()

    # Get historical stats (by month for last 6 months)
    historico = []
    now = datetime.now(UTC)
    for months_back in range(6):
        start_date = now - timedelta(days=30 * (months_back + 1))
        end_date = now - timedelta(days=30 * months_back)
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        Vulnerabilidad.user_id == user_id,
                        Vulnerabilidad.created_at >= start_date,
                        Vulnerabilidad.created_at <= end_date,
                        Vulnerabilidad.deleted_at.is_(None),
                    )
                )
            ).scalar_one()
            or 0
        )
        historico.append(
            {
                "period": start_date.date().isoformat(),
                "count": count,
            }
        )

    return success(
        {
            "user": {
                "id": str(user_obj.id),
                "email": user_obj.email,
                "role": user_obj.role,
            },
            "vulns_asignadas": [
                {
                    "id": str(v.id),
                    "titulo": getattr(v, "titulo", None),
                    "severidad": v.severidad,
                    "estado": v.estado,
                    "fuente": v.fuente,
                    "created_at": v.created_at.isoformat() if v.created_at else None,
                }
                for v in vuln_rows
            ],
            "historico": historico,
        }
    )


# ───────────────────────────────────────────────────────────────────────────────
# DASHBOARD 3: PROGRAMAS — 2 NEW ENDPOINTS
# ───────────────────────────────────────────────────────────────────────────────


@router.get("/programs-summary")
async def dashboard_programs_summary(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 3: Programs summary consolidation."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.programs_summary.view", extra={"event": "dashboard.programs_summary.view"})

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )

    rows = (
        await db.execute(
            select(
                Vulnerabilidad.fuente,
                func.count().label("total"),
                func.sum(case((Vulnerabilidad.estado == "Cerrada", 1), else_=0)).label("closed"),
            )
            .where(
                Vulnerabilidad.deleted_at.is_(None),
                *([hierarchy_filter] if hierarchy_filter is not None else []),
            )
            .group_by(Vulnerabilidad.fuente)
        )
    ).all()

    programas = []
    total_all = 0
    closed_all = 0

    for fuente, total, closed in rows:
        total_i = int(total or 0)
        closed_i = int(closed or 0)
        total_all += total_i
        closed_all += closed_i
        completion = int((closed_i / total_i * 100) if total_i else 0)
        programas.append(
            {
                "fuente": str(fuente),
                "total": total_i,
                "closed": closed_i,
                "completion_percentage": completion,
            }
        )

    consolidado = {
        "total_vulnerabilities": total_all,
        "closed_vulnerabilities": closed_all,
        "overall_completion": int((closed_all / total_all * 100) if total_all else 0),
    }

    return success(
        {
            "programas": programas,
            "consolidado": consolidado,
        }
    )


@router.get("/program/{code}/detail")
async def dashboard_program_detail_new(
    code: str,
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 3: Program detail (by code/fuente)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.program_detail.view", extra={"event": "dashboard.program_detail.view", "code": code})

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )

    # Get program metadata
    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.fuente == code,
                    Vulnerabilidad.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )

    closed = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.fuente == code,
                    Vulnerabilidad.estado == "Cerrada",
                    Vulnerabilidad.deleted_at.is_(None),
                    *([hierarchy_filter] if hierarchy_filter is not None else []),
                )
            )
        ).scalar_one()
        or 0
    )

    # Activities by month
    actividades_mensuales = []
    now = datetime.now(UTC)
    for months_back in range(12):
        start_date = now - timedelta(days=30 * (months_back + 1))
        end_date = now - timedelta(days=30 * months_back)
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        Vulnerabilidad.fuente == code,
                        Vulnerabilidad.created_at >= start_date,
                        Vulnerabilidad.created_at <= end_date,
                        Vulnerabilidad.deleted_at.is_(None),
                        *([hierarchy_filter] if hierarchy_filter is not None else []),
                    )
                )
            ).scalar_one()
            or 0
        )
        actividades_mensuales.append(
            {
                "month": start_date.strftime("%Y-%m"),
                "count": count,
            }
        )

    return success(
        {
            "programa": {
                "code": code,
                "total_vulnerabilities": total,
                "closed_vulnerabilities": closed,
                "completion_percentage": int((closed / total * 100) if total else 0),
            },
            "detalles": {
                "open_vulnerabilities": total - closed,
                "new_this_month": 0,
            },
            "actividades_mensuales": actividades_mensuales,
        }
    )


# ───────────────────────────────────────────────────────────────────────────────
# DASHBOARD 4: VULNERABILIDADES — 13 ENDPOINTS
# ───────────────────────────────────────────────────────────────────────────────


@router.get("/vuln-global")
async def dashboard_vuln_global(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: Global vulnerabilities aggregation (level 0)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_global.view", extra={"event": "dashboard.vuln_global.view"})

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(Vulnerabilidad.deleted_at.is_(None))
            )
        ).scalar_one()
        or 0
    )

    by_severity = {}
    for severity in ["CRITICA", "ALTA", "MEDIA", "BAJA", "INFORMATIVA"]:
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        func.lower(Vulnerabilidad.severidad) == severity.lower(),
                        Vulnerabilidad.deleted_at.is_(None),
                    )
                )
            ).scalar_one()
            or 0
        )
        by_severity[severity] = count

    by_state = {}
    for state in ["Abierta", "En Progreso", "Remediada", "Cerrada"]:
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        Vulnerabilidad.estado == state,
                        Vulnerabilidad.deleted_at.is_(None),
                    )
                )
            ).scalar_one()
            or 0
        )
        by_state[state] = count

    return success(
        {
            "total": total,
            "by_severity": by_severity,
            "by_state": by_state,
        }
    )


@router.get("/vuln-subdireccion/{id}")
async def dashboard_vuln_subdireccion(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: Vulnerabilities by subdireccion (level 1)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_subdireccion.view", extra={"event": "dashboard.vuln_subdireccion.view", "subdir_id": str(id)})

    hierarchy_filter = _vulnerability_hierarchy_filter(subdireccion_id=id)

    if hierarchy_filter is None:
        return success({"total": 0, "by_severity": {}, "by_state": {}})

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    hierarchy_filter,
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    by_severity = {}
    for severity in ["CRITICA", "ALTA", "MEDIA", "BAJA", "INFORMATIVA"]:
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        func.lower(Vulnerabilidad.severidad) == severity.lower(),
                        hierarchy_filter,
                        Vulnerabilidad.deleted_at.is_(None),
                    )
                )
            ).scalar_one()
            or 0
        )
        by_severity[severity] = count

    return success(
        {
            "total": total,
            "by_severity": by_severity,
            "hierarchy_id": str(id),
        }
    )


@router.get("/vuln-celula/{id}")
async def dashboard_vuln_celula(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: Vulnerabilities by celula (level 2)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_celula.view", extra={"event": "dashboard.vuln_celula.view", "celula_id": str(id)})

    hierarchy_filter = _vulnerability_hierarchy_filter(celula_id=id)

    if hierarchy_filter is None:
        return success({"total": 0, "by_severity": {}, "by_state": {}})

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    hierarchy_filter,
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    by_severity = {}
    for severity in ["CRITICA", "ALTA", "MEDIA", "BAJA", "INFORMATIVA"]:
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        func.lower(Vulnerabilidad.severidad) == severity.lower(),
                        hierarchy_filter,
                        Vulnerabilidad.deleted_at.is_(None),
                    )
                )
            ).scalar_one()
            or 0
        )
        by_severity[severity] = count

    return success(
        {
            "total": total,
            "by_severity": by_severity,
            "hierarchy_id": str(id),
        }
    )


@router.get("/vuln-repositorio/{id}/sast")
async def dashboard_vuln_repo_sast(
    id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: SAST vulnerabilities for a repository (paginated)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_repo_sast.view", extra={"event": "dashboard.vuln_repo_sast.view", "repo_id": str(id)})

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.repositorio_id == id,
                    Vulnerabilidad.fuente == "SAST",
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            select(Vulnerabilidad)
            .where(
                Vulnerabilidad.repositorio_id == id,
                Vulnerabilidad.fuente == "SAST",
                Vulnerabilidad.deleted_at.is_(None),
            )
            .order_by(Vulnerabilidad.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
    ).scalars().all()

    items = [
        {
            "id": str(v.id),
            "titulo": getattr(v, "titulo", None),
            "severidad": v.severidad,
            "estado": v.estado,
            "fuente": v.fuente,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in rows
    ]

    return paginated(
        items,
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/vuln-repositorio/{id}/dast")
async def dashboard_vuln_repo_dast(
    id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: DAST vulnerabilities for a repository (paginated)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_repo_dast.view", extra={"event": "dashboard.vuln_repo_dast.view", "repo_id": str(id)})

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.repositorio_id == id,
                    Vulnerabilidad.fuente == "DAST",
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            select(Vulnerabilidad)
            .where(
                Vulnerabilidad.repositorio_id == id,
                Vulnerabilidad.fuente == "DAST",
                Vulnerabilidad.deleted_at.is_(None),
            )
            .order_by(Vulnerabilidad.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
    ).scalars().all()

    items = [
        {
            "id": str(v.id),
            "titulo": getattr(v, "titulo", None),
            "severidad": v.severidad,
            "estado": v.estado,
            "fuente": v.fuente,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in rows
    ]

    return paginated(
        items,
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/vuln-repositorio/{id}/sca")
async def dashboard_vuln_repo_sca(
    id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: SCA vulnerabilities for a repository (paginated)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_repo_sca.view", extra={"event": "dashboard.vuln_repo_sca.view", "repo_id": str(id)})

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.repositorio_id == id,
                    Vulnerabilidad.fuente == "SCA",
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            select(Vulnerabilidad)
            .where(
                Vulnerabilidad.repositorio_id == id,
                Vulnerabilidad.fuente == "SCA",
                Vulnerabilidad.deleted_at.is_(None),
            )
            .order_by(Vulnerabilidad.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
    ).scalars().all()

    items = [
        {
            "id": str(v.id),
            "titulo": getattr(v, "titulo", None),
            "severidad": v.severidad,
            "estado": v.estado,
            "fuente": v.fuente,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in rows
    ]

    return paginated(
        items,
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/vuln-repositorio/{id}/mast-mda")
async def dashboard_vuln_repo_mast_mda(
    id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: MAST+MDA vulnerabilities for a repository (paginated)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_repo_mast_mda.view", extra={"event": "dashboard.vuln_repo_mast_mda.view", "repo_id": str(id)})

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.repositorio_id == id,
                    Vulnerabilidad.fuente.in_(["MAST", "MDA"]),
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            select(Vulnerabilidad)
            .where(
                Vulnerabilidad.repositorio_id == id,
                Vulnerabilidad.fuente.in_(["MAST", "MDA"]),
                Vulnerabilidad.deleted_at.is_(None),
            )
            .order_by(Vulnerabilidad.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
    ).scalars().all()

    items = [
        {
            "id": str(v.id),
            "titulo": getattr(v, "titulo", None),
            "severidad": v.severidad,
            "estado": v.estado,
            "fuente": v.fuente,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in rows
    ]

    return paginated(
        items,
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/vuln-repositorio/{id}/secrets")
async def dashboard_vuln_repo_secrets(
    id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: Secrets vulnerabilities for a repository (paginated)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_repo_secrets.view", extra={"event": "dashboard.vuln_repo_secrets.view", "repo_id": str(id)})

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.repositorio_id == id,
                    Vulnerabilidad.fuente == "Secrets",
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            select(Vulnerabilidad)
            .where(
                Vulnerabilidad.repositorio_id == id,
                Vulnerabilidad.fuente == "Secrets",
                Vulnerabilidad.deleted_at.is_(None),
            )
            .order_by(Vulnerabilidad.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
    ).scalars().all()

    items = [
        {
            "id": str(v.id),
            "titulo": getattr(v, "titulo", None),
            "severidad": v.severidad,
            "estado": v.estado,
            "fuente": v.fuente,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in rows
    ]

    return paginated(
        items,
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/vuln-repositorio/{id}/cds")
async def dashboard_vuln_repo_cds(
    id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: CDS vulnerabilities for a repository (paginated)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_repo_cds.view", extra={"event": "dashboard.vuln_repo_cds.view", "repo_id": str(id)})

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.repositorio_id == id,
                    Vulnerabilidad.fuente == "CDS",
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            select(Vulnerabilidad)
            .where(
                Vulnerabilidad.repositorio_id == id,
                Vulnerabilidad.fuente == "CDS",
                Vulnerabilidad.deleted_at.is_(None),
            )
            .order_by(Vulnerabilidad.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
    ).scalars().all()

    items = [
        {
            "id": str(v.id),
            "titulo": getattr(v, "titulo", None),
            "severidad": v.severidad,
            "estado": v.estado,
            "fuente": v.fuente,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in rows
    ]

    return paginated(
        items,
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/vuln-repositorio/{id}/historial")
async def dashboard_vuln_repo_historial(
    id: UUID,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: Vulnerability timeline history for a repository."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_repo_historial.view", extra={"event": "dashboard.vuln_repo_historial.view", "repo_id": str(id)})

    now = datetime.now(UTC)
    start_date = now - timedelta(days=days)

    rows = (
        await db.execute(
            select(Vulnerabilidad)
            .where(
                Vulnerabilidad.repositorio_id == id,
                Vulnerabilidad.created_at >= start_date,
                Vulnerabilidad.deleted_at.is_(None),
            )
            .order_by(Vulnerabilidad.created_at.desc())
            .limit(100)
        )
    ).scalars().all()

    timeline = [
        {
            "id": str(v.id),
            "titulo": getattr(v, "titulo", None),
            "severidad": v.severidad,
            "estado": v.estado,
            "fuente": v.fuente,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in rows
    ]

    return success(
        {
            "repository_id": str(id),
            "timeline": timeline,
            "period_days": days,
        }
    )


@router.get("/vuln-repositorio/{id}/config")
async def dashboard_vuln_repo_config(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: Repository metadata and config."""
    from app.models.repositorio import Repositorio

    logger.info("dashboard.vuln_repo_config.view", extra={"event": "dashboard.vuln_repo_config.view", "repo_id": str(id)})

    repo = (
        await db.execute(
            select(Repositorio).where(
                Repositorio.id == id,
                Repositorio.deleted_at.is_(None),
            )
        )
    ).scalars().first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repositorio no encontrado")

    return success(
        {
            "id": str(repo.id),
            "nombre": repo.nombre,
            "url": repo.url,
            "plataforma": repo.plataforma,
            "rama_default": repo.rama_default,
            "activo": repo.activo,
            "celula_id": str(repo.celula_id),
            "created_at": repo.created_at.isoformat() if repo.created_at else None,
            "updated_at": repo.updated_at.isoformat() if repo.updated_at else None,
        }
    )


@router.get("/vuln-repositorio/{id}/resumen")
async def dashboard_vuln_repo_resumen(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: Repository vulnerability summary."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_repo_resumen.view", extra={"event": "dashboard.vuln_repo_resumen.view", "repo_id": str(id)})

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.repositorio_id == id,
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    by_severity = {}
    for severity in ["CRITICA", "ALTA", "MEDIA", "BAJA", "INFORMATIVA"]:
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        func.lower(Vulnerabilidad.severidad) == severity.lower(),
                        Vulnerabilidad.repositorio_id == id,
                        Vulnerabilidad.deleted_at.is_(None),
                    )
                )
            ).scalar_one()
            or 0
        )
        by_severity[severity] = count

    by_fuente = {}
    fuente_rows = (
        await db.execute(
            select(Vulnerabilidad.fuente, func.count().label("count"))
            .where(
                Vulnerabilidad.repositorio_id == id,
                Vulnerabilidad.deleted_at.is_(None),
            )
            .group_by(Vulnerabilidad.fuente)
        )
    ).all()

    for fuente, count in fuente_rows:
        by_fuente[str(fuente)] = int(count)

    return success(
        {
            "repository_id": str(id),
            "total": total,
            "by_severity": by_severity,
            "by_fuente": by_fuente,
        }
    )


@router.get("/vuln-repositorio/{id}/detail")
async def dashboard_vuln_repo_detail(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: Full repository vulnerability details."""
    from app.models.repositorio import Repositorio
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_repo_detail.view", extra={"event": "dashboard.vuln_repo_detail.view", "repo_id": str(id)})

    repo = (
        await db.execute(
            select(Repositorio).where(
                Repositorio.id == id,
                Repositorio.deleted_at.is_(None),
            )
        )
    ).scalars().first()

    if not repo:
        raise HTTPException(status_code=404, detail="Repositorio no encontrado")

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.repositorio_id == id,
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    closed = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.repositorio_id == id,
                    Vulnerabilidad.estado == "Cerrada",
                    Vulnerabilidad.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    by_severity = {}
    for severity in ["CRITICA", "ALTA", "MEDIA", "BAJA", "INFORMATIVA"]:
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        func.lower(Vulnerabilidad.severidad) == severity.lower(),
                        Vulnerabilidad.repositorio_id == id,
                        Vulnerabilidad.deleted_at.is_(None),
                    )
                )
            ).scalar_one()
            or 0
        )
        by_severity[severity] = count

    return success(
        {
            "repository": {
                "id": str(repo.id),
                "nombre": repo.nombre,
                "url": repo.url,
                "plataforma": repo.plataforma,
            },
            "statistics": {
                "total_vulnerabilities": total,
                "closed_vulnerabilities": closed,
                "open_vulnerabilities": total - closed,
                "completion_percentage": int((closed / total * 100) if total > 0 else 0),
            },
            "by_severity": by_severity,
        }
    )


# ───────────────────────────────────────────────────────────────────────────────
# DASHBOARD 5: CONCENTRADO — 3 NEW ENDPOINTS
# ───────────────────────────────────────────────────────────────────────────────


@router.get("/vuln-concentrated/by-motor")
async def dashboard_vuln_concentrated_by_motor(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 5: Concentrated vulnerabilities by motor/source."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_concentrated_by_motor.view", extra={"event": "dashboard.vuln_concentrated_by_motor.view"})

    rows = (
        await db.execute(
            select(Vulnerabilidad.fuente, func.count().label("count"))
            .where(Vulnerabilidad.deleted_at.is_(None))
            .group_by(Vulnerabilidad.fuente)
            .order_by(func.count().desc())
        )
    ).all()

    motores = [
        {
            "nombre": str(fuente),
            "count": int(count),
        }
        for fuente, count in rows
    ]

    return success(
        {
            "motores": motores,
        }
    )


@router.get("/vuln-concentrated/by-severity")
async def dashboard_vuln_concentrated_by_severity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 5: Concentrated vulnerabilities by severity."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_concentrated_by_severity.view", extra={"event": "dashboard.vuln_concentrated_by_severity.view"})

    severidades = ["CRITICA", "ALTA", "MEDIA", "BAJA", "INFORMATIVA"]
    result = []

    for severity in severidades:
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        func.lower(Vulnerabilidad.severidad) == severity.lower(),
                        Vulnerabilidad.deleted_at.is_(None),
                    )
                )
            ).scalar_one()
            or 0
        )
        result.append(
            {
                "severidad": severity,
                "count": count,
            }
        )

    return success(
        {
            "severidades": result,
        }
    )


@router.get("/vuln-concentrated/table")
async def dashboard_vuln_concentrated_table(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    fuente: str | None = Query(None),
    severidad: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 5: Concentrated vulnerabilities table (paginated)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    logger.info("dashboard.vuln_concentrated_table.view", extra={"event": "dashboard.vuln_concentrated_table.view"})

    filters = [Vulnerabilidad.deleted_at.is_(None)]
    if fuente:
        filters.append(Vulnerabilidad.fuente == fuente)
    if severidad:
        filters.append(func.lower(Vulnerabilidad.severidad) == severidad.lower())

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(*filters)
            )
        ).scalar_one()
        or 0
    )

    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            select(Vulnerabilidad)
            .where(*filters)
            .order_by(Vulnerabilidad.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
    ).scalars().all()

    items = [
        {
            "id": str(v.id),
            "titulo": getattr(v, "titulo", None),
            "severidad": v.severidad,
            "estado": v.estado,
            "fuente": v.fuente,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in rows
    ]

    return paginated(
        items,
        page=page,
        page_size=page_size,
        total=total,
    )


# ───────────────────────────────────────────────────────────────────────────────
# DASHBOARD 6: OPERACIÓN — 3 NEW ENDPOINTS
# ───────────────────────────────────────────────────────────────────────────────


@router.get("/release-terceros")
async def dashboard_release_terceros(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 6: Third-party releases table (paginated)."""
    from app.models.revision_tercero import RevisionTercero

    logger.info("dashboard.release_terceros.view", extra={"event": "dashboard.release_terceros.view"})

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(RevisionTercero)
                .where(RevisionTercero.deleted_at.is_(None))
            )
        ).scalar_one()
        or 0
    )

    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            select(RevisionTercero)
            .where(RevisionTercero.deleted_at.is_(None))
            .order_by(RevisionTercero.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
    ).scalars().all()

    items = [
        {
            "id": str(v.id),
            "nombre": getattr(v, "nombre", None),
            "estado": getattr(v, "estado", None),
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in rows
    ]

    return paginated(
        items,
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/release/{id}/detail")
async def dashboard_release_detail(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 6: Release detail."""
    from app.models.service_release import ServiceRelease

    logger.info("dashboard.release_detail.view", extra={"event": "dashboard.release_detail.view", "release_id": str(id)})

    release = (
        await db.execute(
            select(ServiceRelease).where(
                ServiceRelease.id == id,
                ServiceRelease.deleted_at.is_(None),
            )
        )
    ).scalars().first()

    if not release:
        raise HTTPException(status_code=404, detail="Release no encontrado")

    return success(
        {
            "id": str(release.id),
            "nombre": release.nombre,
            "version": release.version,
            "descripcion": release.descripcion,
            "estado_actual": release.estado_actual,
            "jira_referencia": release.jira_referencia,
            "created_at": release.created_at.isoformat() if release.created_at else None,
            "updated_at": release.updated_at.isoformat() if release.updated_at else None,
        }
    )


# ───────────────────────────────────────────────────────────────────────────────
# DASHBOARD 7: KANBAN — 1 NEW ENDPOINT (columns config)
# ───────────────────────────────────────────────────────────────────────────────


@router.get("/release-kanban-columns")
async def dashboard_release_kanban_columns(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 7: Kanban columns configuration."""
    logger.info("dashboard.release_kanban_columns.view", extra={"event": "dashboard.release_kanban_columns.view"})

    columns = [
        "Borrador",
        "Pendiente Aprobación",
        "Design Review",
        "Security Validation",
        "En Ejecución",
        "Completado",
    ]

    return success(
        {
            "columns": [{"id": c.lower().replace(" ", "_"), "nombre": c} for c in columns],
        }
    )


# ───────────────────────────────────────────────────────────────────────────────
# DASHBOARD 8: INICIATIVAS — 2 NEW ENDPOINTS
# ───────────────────────────────────────────────────────────────────────────────


@router.get("/initiatives-summary")
async def dashboard_initiatives_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 8: Initiatives summary with full list."""
    from app.models.iniciativa import Iniciativa

    logger.info("dashboard.initiatives_summary.view", extra={"event": "dashboard.initiatives_summary.view"})

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

    at_risk = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Iniciativa)
                .where(
                    Iniciativa.estado == "En Riesgo",
                    Iniciativa.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    rows = (
        await db.execute(
            select(Iniciativa)
            .where(Iniciativa.deleted_at.is_(None))
            .order_by(Iniciativa.created_at.desc())
            .limit(100)
        )
    ).scalars().all()

    iniciativas = [
        {
            "id": str(ini.id),
            "titulo": ini.titulo,
            "descripcion": ini.descripcion,
            "estado": ini.estado,
            "tipo": ini.tipo,
            "fecha_inicio": ini.fecha_inicio.isoformat() if ini.fecha_inicio else None,
            "fecha_fin_estimada": ini.fecha_fin_estimada.isoformat() if ini.fecha_fin_estimada else None,
            "created_at": ini.created_at.isoformat() if ini.created_at else None,
        }
        for ini in rows
    ]

    return success(
        {
            "kpis": {
                "total": total,
                "completed": completed,
                "in_progress": in_progress,
                "at_risk": at_risk,
                "completion_percentage": int((completed / total * 100) if total > 0 else 0),
            },
            "iniciativas": iniciativas,
        }
    )


@router.get("/initiative/{id}/detail")
async def dashboard_initiative_detail(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 8: Initiative detail with hitos and actualizaciones."""
    from app.models.actualizacion_iniciativa import ActualizacionIniciativa
    from app.models.hito_iniciativa import HitoIniciativa
    from app.models.iniciativa import Iniciativa

    logger.info("dashboard.initiative_detail.view", extra={"event": "dashboard.initiative_detail.view", "iniciativa_id": str(id)})

    iniciativa = (
        await db.execute(
            select(Iniciativa).where(
                Iniciativa.id == id,
                Iniciativa.deleted_at.is_(None),
            )
        )
    ).scalars().first()

    if not iniciativa:
        raise HTTPException(status_code=404, detail="Iniciativa no encontrada")

    hitos = (
        await db.execute(
            select(HitoIniciativa)
            .where(
                HitoIniciativa.iniciativa_id == id,
                HitoIniciativa.deleted_at.is_(None),
            )
            .order_by(HitoIniciativa.fecha_estimada.desc())
        )
    ).scalars().all()

    actualizaciones = (
        await db.execute(
            select(ActualizacionIniciativa)
            .where(
                ActualizacionIniciativa.iniciativa_id == id,
                ActualizacionIniciativa.deleted_at.is_(None),
            )
            .order_by(ActualizacionIniciativa.created_at.desc())
            .limit(20)
        )
    ).scalars().all()

    total_hitos = len(hitos)
    completed_hitos = sum(1 for h in hitos if h.estado == "Completado")
    avg_completion = (
        sum(h.porcentaje_completado or 0 for h in hitos) / total_hitos if total_hitos > 0 else 0
    )

    return success(
        {
            "iniciativa": {
                "id": str(iniciativa.id),
                "titulo": iniciativa.titulo,
                "estado": iniciativa.estado,
                "tipo": iniciativa.tipo,
                "fecha_inicio": iniciativa.fecha_inicio.isoformat() if iniciativa.fecha_inicio else None,
                "fecha_fin_estimada": iniciativa.fecha_fin_estimada.isoformat() if iniciativa.fecha_fin_estimada else None,
                "created_at": iniciativa.created_at.isoformat() if iniciativa.created_at else None,
                "updated_at": iniciativa.updated_at.isoformat() if iniciativa.updated_at else None,
            },
            "detalle": {
                "descripcion": iniciativa.descripcion,
                "total_hitos": total_hitos,
                "completed_hitos": completed_hitos,
                "avg_completion_percentage": int(avg_completion),
            },
            "hitos": [
                {
                    "id": str(h.id),
                    "titulo": h.titulo,
                    "descripcion": h.descripcion,
                    "estado": h.estado,
                    "porcentaje_completado": h.porcentaje_completado or 0,
                    "fecha_estimada": h.fecha_estimada.isoformat() if h.fecha_estimada else None,
                    "created_at": h.created_at.isoformat() if h.created_at else None,
                }
                for h in hitos
            ],
            "actualizaciones": [
                {
                    "id": str(a.id),
                    "titulo": a.titulo,
                    "contenido": a.contenido,
                    "tipo_actualizacion": a.tipo_actualizacion,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in actualizaciones
            ],
            "ponderacion": {
                "total_hitos": total_hitos,
                "completed_hitos": completed_hitos,
                "completion_percentage": int(avg_completion),
            },
        }
    )


# ───────────────────────────────────────────────────────────────────────────────
# DASHBOARD 9: TEMAS EMERGENTES — 2 NEW ENDPOINTS
# ───────────────────────────────────────────────────────────────────────────────


@router.get("/emerging-themes-summary")
async def dashboard_emerging_themes_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 9: Emerging themes summary with full list."""
    from app.models.tema_emergente import TemaEmergente

    logger.info("dashboard.emerging_themes_summary.view", extra={"event": "dashboard.emerging_themes_summary.view"})

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

    now = datetime.now(UTC)
    old_date = now - timedelta(days=7)
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

    # High impact themes
    alto_impacto = int(
        (
            await db.execute(
                select(func.count())
                .select_from(TemaEmergente)
                .where(
                    TemaEmergente.impacto == "Alto",
                    TemaEmergente.deleted_at.is_(None),
                )
            )
        ).scalar_one()
        or 0
    )

    # Fetch all themes for the list
    temas_rows = (
        await db.execute(
            select(TemaEmergente)
            .where(TemaEmergente.deleted_at.is_(None))
            .order_by(TemaEmergente.updated_at.desc())
        )
    ).scalars().all()

    temas_list = []
    for tema in temas_rows:
        dias_abierto = (now - tema.created_at).days
        temas_list.append(
            {
                "id": str(tema.id),
                "titulo": tema.titulo,
                "descripcion": tema.descripcion,
                "estado": tema.estado,
                "impacto": tema.impacto,
                "tipo": tema.tipo,
                "fuente": tema.fuente,
                "fecha_identificacion": tema.created_at.isoformat(),
                "dias_abierto": dias_abierto,
                "created_at": tema.created_at.isoformat(),
                "updated_at": tema.updated_at.isoformat(),
            }
        )

    return success(
        {
            "total_themes": total,
            "high_impact_themes": alto_impacto,
            "recent_themes": unmoved,
            "kpis": {
                "total": total,
                "active": total - unmoved,
                "unmoved_7_days": unmoved,
                "high_impact": alto_impacto,
            },
            "themes": temas_list,
        }
    )


@router.get("/tema/{id}/detail")
async def dashboard_tema_detail(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 9: Emerging theme detail with bitácora timeline."""
    from app.models.tema_emergente import TemaEmergente
    from app.models.actualizacion_tema import ActualizacionTema
    from app.models.user import User as UserModel

    logger.info("dashboard.tema_detail.view", extra={"event": "dashboard.tema_detail.view", "tema_id": str(id)})

    tema = (
        await db.execute(
            select(TemaEmergente).where(
                TemaEmergente.id == id,
                TemaEmergente.deleted_at.is_(None),
            )
        )
    ).scalars().first()

    if not tema:
        raise HTTPException(status_code=404, detail="Tema emergente no encontrado")

    now = datetime.now(UTC)
    dias_abierto = (now - tema.created_at).days

    # Fetch updates (bitácora)
    actualizaciones = (
        await db.execute(
            select(ActualizacionTema)
            .where(
                ActualizacionTema.tema_id == id,
                ActualizacionTema.deleted_at.is_(None),
            )
            .order_by(ActualizacionTema.created_at.desc())
        )
    ).scalars().all()

    # Fetch creator name
    creator = (
        await db.execute(
            select(UserModel).where(UserModel.id == tema.user_id)
        )
    ).scalars().first()

    bitacora_items = []
    for act in actualizaciones:
        # Get author name for this update
        author = (
            await db.execute(
                select(UserModel).where(UserModel.id == act.user_id)
            )
        ).scalars().first()
        
        bitacora_items.append(
            {
                "id": str(act.id),
                "titulo": act.titulo,
                "contenido": act.contenido,
                "fuente": act.fuente,
                "autor": author.email if author else "Sistema",
                "fecha": act.created_at.isoformat(),
            }
        )

    return success(
        {
            "tema": {
                "id": str(tema.id),
                "titulo": tema.titulo,
                "descripcion": tema.descripcion,
                "tipo": tema.tipo,
                "impacto": tema.impacto,
                "estado": tema.estado,
                "fuente": tema.fuente,
                "dias_abierto": dias_abierto,
                "created_at": tema.created_at.isoformat(),
                "updated_at": tema.updated_at.isoformat(),
                "creado_por": creator.email if creator else "Sistema",
            },
            "bitacora": bitacora_items,
            "metadata": {
                "total_updates": len(bitacora_items),
                "last_update": bitacora_items[0]["fecha"] if bitacora_items else tema.updated_at.isoformat(),
            },
        }
    )


# ───────────────────────────────────────────────────────────────────────────────
# Dashboard 3: Program Types Summary (SAST, DAST, Threat Modeling, Source Code)
# ───────────────────────────────────────────────────────────────────────────────


@router.get("/dashboard3/programs-summary")
async def dashboard3_programs_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 3: Program types summary.
    
    Returns aggregated data for SAST, DAST, Threat Modeling, and Source Code programs,
    with completion percentages and activity metrics.
    """
    from app.models.programa_dast import ProgramaDast
    from app.models.programa_sast import ProgramaSast
    from app.models.programa_source_code import ProgramaSourceCode
    from app.models.programa_threat_modeling import ProgramaThreatModeling

    logger.info("dashboard3.programs_summary.view", extra={"event": "dashboard3.programs_summary.view"})

    # Get counts for each program type for the current user
    sast_count = int(
        (
            await db.execute(
                select(func.count()).select_from(ProgramaSast).where(
                    ProgramaSast.user_id == current_user.id, ProgramaSast.deleted_at.is_(None)
                )
            )
        ).scalar()
        or 0
    )

    dast_count = int(
        (
            await db.execute(
                select(func.count()).select_from(ProgramaDast).where(
                    ProgramaDast.user_id == current_user.id, ProgramaDast.deleted_at.is_(None)
                )
            )
        ).scalar()
        or 0
    )

    threat_modeling_count = int(
        (
            await db.execute(
                select(func.count()).select_from(ProgramaThreatModeling).where(
                    ProgramaThreatModeling.user_id == current_user.id,
                    ProgramaThreatModeling.deleted_at.is_(None),
                )
            )
        ).scalar()
        or 0
    )

    source_code_count = int(
        (
            await db.execute(
                select(func.count()).select_from(ProgramaSourceCode).where(
                    ProgramaSourceCode.user_id == current_user.id, ProgramaSourceCode.deleted_at.is_(None)
                )
            )
        ).scalar()
        or 0
    )

    # Get active vs completed counts
    sast_active = int(
        (
            await db.execute(
                select(func.count()).select_from(ProgramaSast).where(
                    ProgramaSast.user_id == current_user.id,
                    ProgramaSast.deleted_at.is_(None),
                    ProgramaSast.estado == "Activo",
                )
            )
        ).scalar()
        or 0
    )

    dast_active = int(
        (
            await db.execute(
                select(func.count()).select_from(ProgramaDast).where(
                    ProgramaDast.user_id == current_user.id,
                    ProgramaDast.deleted_at.is_(None),
                    ProgramaDast.estado == "Activo",
                )
            )
        ).scalar()
        or 0
    )

    threat_modeling_active = int(
        (
            await db.execute(
                select(func.count()).select_from(ProgramaThreatModeling).where(
                    ProgramaThreatModeling.user_id == current_user.id,
                    ProgramaThreatModeling.deleted_at.is_(None),
                    ProgramaThreatModeling.estado == "Activo",
                )
            )
        ).scalar()
        or 0
    )

    source_code_active = int(
        (
            await db.execute(
                select(func.count()).select_from(ProgramaSourceCode).where(
                    ProgramaSourceCode.user_id == current_user.id,
                    ProgramaSourceCode.deleted_at.is_(None),
                    ProgramaSourceCode.estado == "Activo",
                )
            )
        ).scalar()
        or 0
    )

    programs = [
        {
            "code": "SAST",
            "name": "Static Application Security Testing",
            "total": sast_count,
            "active": sast_active,
            "completion_percentage": int(((sast_count - sast_active) / sast_count * 100) if sast_count else 0),
            "status": "active" if sast_active > 0 else "idle",
        },
        {
            "code": "DAST",
            "name": "Dynamic Application Security Testing",
            "total": dast_count,
            "active": dast_active,
            "completion_percentage": int(((dast_count - dast_active) / dast_count * 100) if dast_count else 0),
            "status": "active" if dast_active > 0 else "idle",
        },
        {
            "code": "THREAT_MODELING",
            "name": "Threat Modeling (STRIDE/DREAD)",
            "total": threat_modeling_count,
            "active": threat_modeling_active,
            "completion_percentage": int(
                ((threat_modeling_count - threat_modeling_active) / threat_modeling_count * 100)
                if threat_modeling_count
                else 0
            ),
            "status": "active" if threat_modeling_active > 0 else "idle",
        },
        {
            "code": "SOURCE_CODE",
            "name": "Source Code Review & Controls",
            "total": source_code_count,
            "active": source_code_active,
            "completion_percentage": int(
                ((source_code_count - source_code_active) / source_code_count * 100) if source_code_count else 0
            ),
            "status": "active" if source_code_active > 0 else "idle",
        },
    ]

    total_programs = sum(p["total"] for p in programs)
    avg_completion = int(
        (sum(p["completion_percentage"] for p in programs) / len(programs)) if programs else 0
    )

    return success(
        {
            "programs": programs,
            "summary": {
                "total_programs": total_programs,
                "avg_completion_percentage": avg_completion,
                "active_programs": sum(p["active"] for p in programs),
            },
        }
    )


@router.get("/dashboard3/program/{code}/detail")
async def dashboard3_program_detail(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 3: Program detail (by code: SAST, DAST, THREAT_MODELING, SOURCE_CODE).
    
    Returns detailed data including monthly activities and trends for a specific program type.
    """
    from app.models.programa_dast import ProgramaDast
    from app.models.programa_sast import ProgramaSast
    from app.models.programa_source_code import ProgramaSourceCode
    from app.models.programa_threat_modeling import ProgramaThreatModeling

    logger.info(
        "dashboard3.program_detail.view",
        extra={"event": "dashboard3.program_detail.view", "code": code},
    )

    code_upper = code.upper()

    if code_upper == "SAST":
        programs = (
            (
                await db.execute(
                    select(ProgramaSast)
                    .where(
                        ProgramaSast.user_id == current_user.id,
                        ProgramaSast.deleted_at.is_(None),
                    )
                    .order_by(ProgramaSast.ano.desc(), ProgramaSast.created_at.desc())
                )
            )
            .scalars()
            .all()
        )
        program_type = "SAST"

    elif code_upper == "DAST":
        programs = (
            (
                await db.execute(
                    select(ProgramaDast)
                    .where(
                        ProgramaDast.user_id == current_user.id,
                        ProgramaDast.deleted_at.is_(None),
                    )
                    .order_by(ProgramaDast.ano.desc(), ProgramaDast.created_at.desc())
                )
            )
            .scalars()
            .all()
        )
        program_type = "DAST"

    elif code_upper == "THREAT_MODELING":
        programs = (
            (
                await db.execute(
                    select(ProgramaThreatModeling)
                    .where(
                        ProgramaThreatModeling.user_id == current_user.id,
                        ProgramaThreatModeling.deleted_at.is_(None),
                    )
                    .order_by(ProgramaThreatModeling.ano.desc(), ProgramaThreatModeling.created_at.desc())
                )
            )
            .scalars()
            .all()
        )
        program_type = "THREAT_MODELING"

    elif code_upper == "SOURCE_CODE":
        programs = (
            (
                await db.execute(
                    select(ProgramaSourceCode)
                    .where(
                        ProgramaSourceCode.user_id == current_user.id,
                        ProgramaSourceCode.deleted_at.is_(None),
                    )
                    .order_by(ProgramaSourceCode.ano.desc(), ProgramaSourceCode.created_at.desc())
                )
            )
            .scalars()
            .all()
        )
        program_type = "SOURCE_CODE"

    else:
        raise HTTPException(status_code=400, detail=f"Unknown program code: {code}")

    program_list = [
        {
            "id": str(p.id),
            "nombre": p.nombre,
            "ano": p.ano,
            "descripcion": p.descripcion or "",
            "estado": p.estado,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
        }
        for p in programs
    ]

    # Calculate monthly trends (count by month for last 12 months)
    now = datetime.now(UTC)
    last_year = now - timedelta(days=365)

    monthly_trends = []
    for i in range(12):
        month_date = now - timedelta(days=30 * i)
        month_key = month_date.strftime("%Y-%m")
        month_count = sum(
            1
            for p in programs
            if p.created_at >= (month_date - timedelta(days=30)) and p.created_at < month_date
        )
        monthly_trends.insert(0, {"month": month_key, "count": month_count})

    total_active = sum(1 for p in programs if p.estado == "Activo")
    total_completed = sum(1 for p in programs if p.estado == "Completado")
    total_cancelled = sum(1 for p in programs if p.estado == "Cancelado")

    return success(
        {
            "program_type": program_type,
            "programs": program_list,
            "summary": {
                "total": len(programs),
                "active": total_active,
                "completed": total_completed,
                "cancelled": total_cancelled,
                "completion_percentage": int(
                    (total_completed / len(programs) * 100) if len(programs) > 0 else 0
                ),
            },
            "monthly_trends": monthly_trends,
        }
    )


@router.get("/releases-terceros")
async def dashboard_releases_terceros(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 6: Third-party releases table (paginated)."""
    from app.models.revision_tercero import RevisionTercero

    logger.info("dashboard.releases_terceros.view", extra={"event": "dashboard.releases_terceros.view"})

    total = int(
        (
            await db.execute(
                select(func.count())
                .select_from(RevisionTercero)
                .where(RevisionTercero.deleted_at.is_(None))
            )
        ).scalar_one()
        or 0
    )

    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            select(RevisionTercero)
            .where(RevisionTercero.deleted_at.is_(None))
            .order_by(RevisionTercero.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
    ).scalars().all()

    items = [
        {
            "id": str(v.id),
            "nombre_empresa": v.nombre_empresa,
            "tipo": v.tipo,
            "estado": v.estado,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in rows
    ]

    return success(
        {
            "items": items,
            "total": total,
        }
    )


# ─── Dashboard 7: Kanban de Liberaciones ─────────────────────────────────────


@router.get("/release-kanban-columns")
async def dashboard_release_kanban_columns(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 7.1: Obtiene las columnas configuradas del kanban.
    
    Retorna las 8 columnas en orden configurado.
    """
    from app.models.kanban_column import KanbanColumn
    from app.schemas.kanban_release import KanbanColumnRead

    logger.info(
        "dashboard.release_kanban_columns.view",
        extra={"event": "dashboard.release_kanban_columns.view"},
    )

    # Obtener columnas ordenadas
    columnas = (
        await db.execute(
            select(KanbanColumn)
            .where(KanbanColumn.deleted_at.is_(None))
            .order_by(KanbanColumn.orden.asc())
        )
    ).scalars().all()

    return success([KanbanColumnRead.model_validate(c).model_dump(mode="json") for c in columnas])


@router.get("/releases-kanban")
async def dashboard_releases_kanban(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 7.2: Obtiene datos completos del kanban con releases agrupadas por columna.
    
    Retorna todas las releases agrupadas por estado (columnas).
    """
    from app.models.kanban_column import KanbanColumn
    from app.models.service_release import ServiceRelease
    from app.models.etapa_release import EtapaRelease
    from app.models.servicio import Servicio
    from app.schemas.kanban_release import (
        ReleaseKanbanColumn,
        ReleaseKanbanData,
        ReleaseKanbanBoard,
    )

    logger.info(
        "dashboard.releases_kanban.view",
        extra={"event": "dashboard.releases_kanban.view"},
    )

    # Obtener columnas del kanban
    columnas_db = (
        await db.execute(
            select(KanbanColumn)
            .where(KanbanColumn.deleted_at.is_(None))
            .order_by(KanbanColumn.orden.asc())
        )
    ).scalars().all()

    # Obtener releases agrupadas por estado
    releases_stmt = (
        select(ServiceRelease, Servicio)
        .join(Servicio, ServiceRelease.servicio_id == Servicio.id)
        .where(ServiceRelease.deleted_at.is_(None), Servicio.deleted_at.is_(None))
        .order_by(ServiceRelease.updated_at.desc())
    )
    releases_result = await db.execute(releases_stmt)
    releases_data = releases_result.all()

    # Agrupar por estado
    releases_por_estado: dict[str, list] = {}
    for sr, servicio in releases_data:
        if sr.estado_actual not in releases_por_estado:
            releases_por_estado[sr.estado_actual] = []
        
        # Contar etapas completadas
        etapas = (
            await db.execute(
                select(EtapaRelease).where(
                    EtapaRelease.service_release_id == sr.id,
                    EtapaRelease.deleted_at.is_(None),
                )
            )
        ).scalars().all()
        
        etapas_completadas = sum(1 for e in etapas if e.estado in ["Aprobada"])

        release_data = ReleaseKanbanData(
            id=sr.id,
            nombre=sr.nombre,
            version=sr.version,
            estado_actual=sr.estado_actual,
            servicio_id=sr.servicio_id,
            servicio_nombre=servicio.nombre,
            user_id=sr.user_id,
            created_at=sr.created_at,
            updated_at=sr.updated_at,
            fecha_entrada=sr.fecha_entrada,
            etapas_count=len(etapas),
            etapas_completadas=etapas_completadas,
        )
        releases_por_estado[sr.estado_actual].append(release_data)

    # Construir columnas con releases
    columnas_result = []
    for col in columnas_db:
        releases = releases_por_estado.get(col.estado_correspondiente, [])
        columna_result = ReleaseKanbanColumn(
            id=col.id,
            nombre=col.nombre,
            color=col.color,
            estado_correspondiente=col.estado_correspondiente,
            releases=releases,
            release_count=len(releases),
            orden=col.orden,
        )
        columnas_result.append(columna_result)

    total_releases = sum(len(r) for r in releases_por_estado.values())
    kanban_board = ReleaseKanbanBoard(
        columnas=columnas_result,
        total_releases=total_releases,
        metadata={
            "ultima_actualizacion": datetime.now(UTC).isoformat(),
            "estados_validos": list(releases_por_estado.keys()),
        },
    )

    return success(kanban_board.model_dump(mode="json"))


@router.patch("/service-releases/{id}/move")
async def move_service_release(
    id: UUID,
    move_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.RELEASES.UPDATE)),
):
    """Dashboard 7.3: Mueve un release a otra columna (drag-drop).
    
    Aplicavalidación de SoD si aplica.
    
    Request body:
    {
        "column_id": "<uuid>",
        "nueva_etapa": "En Produccion",
        "notas": "Movido a producción"
    }
    """
    from app.models.kanban_column import KanbanColumn
    from app.models.service_release import ServiceRelease
    from app.services.service_release_service import service_release_svc
    from app.services.regla_so_d_service import validate_sod

    logger.info(
        "dashboard.service_release.move",
        extra={
            "event": "dashboard.service_release.move",
            "release_id": str(id),
            "user_id": str(current_user.id),
        },
    )

    # Obtener release actual
    release = await service_release_svc.get(db, id)
    if not release:
        raise HTTPException(status_code=404, detail="Release no encontrado")

    # Obtener columna destino
    column_id = move_data.get("column_id")
    if not column_id:
        raise HTTPException(status_code=400, detail="column_id requerido")

    column = (
        await db.execute(
            select(KanbanColumn).where(
                KanbanColumn.id == column_id,
                KanbanColumn.deleted_at.is_(None),
            )
        )
    ).scalars().first()

    if not column:
        raise HTTPException(status_code=404, detail="Columna no encontrada")

    nuevo_estado = column.estado_correspondiente

    # Validar SoD si aplica
    try:
        await validate_sod(
            db,
            regla_tipo="release.mover",
            usuario_id=current_user.id,
            entidad_id=release.id,
            usuario_propietario=release.user_id,
        )
    except Exception as e:
        logger.warning(
            "dashboard.service_release.move.sod_violation",
            extra={
                "event": "dashboard.service_release.move.sod_violation",
                "release_id": str(id),
                "user_id": str(current_user.id),
                "error": str(e),
            },
        )
        raise HTTPException(status_code=403, detail=f"Violación de SoD: {str(e)}")

    # Actualizar estado del release
    update_schema = ServiceReleaseUpdate(estado_actual=nuevo_estado)
    updated = await service_release_svc.update(db, id, update_schema, scope={"user_id": release.user_id})

    if not updated:
        raise HTTPException(status_code=500, detail="Error al actualizar release")

    logger.info(
        "dashboard.service_release.moved",
        extra={
            "event": "dashboard.service_release.moved",
            "release_id": str(id),
            "nuevo_estado": nuevo_estado,
            "user_id": str(current_user.id),
        },
    )

    from app.schemas.service_release import ServiceReleaseRead

    return success(ServiceReleaseRead.model_validate(updated).model_dump(mode="json"))