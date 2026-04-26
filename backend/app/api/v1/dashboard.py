"""Dashboard aggregate stats — read-only endpoint consumed by the home page.

Scope rules:

* Regular users see counters scoped to their own ``user_id``.
* Admins see global counters plus ``users_by_role`` and ``recent_activity``
  from ``audit_logs``.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, case, exists, func, not_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.core.permissions import P
from app.core.response import success
from app.models.audit_log import AuditLog
from app.models.task import Task
from app.models.user import User
from app.schemas.audit_log import AuditLogRead

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
    direccion_id: UUID | None = Query(default=None),
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    repositorio_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: Vulnerabilities with 7-level drilldown."""
    from app.models.celula import Celula
    from app.models.gerencia import Gerencia
    from app.models.organizacion import Organizacion
    from app.models.repositorio import Repositorio
    from app.models.subdireccion import Subdireccion
    from app.models.vulnerabilidad import Vulnerabilidad

    hierarchy_filter = _vulnerability_hierarchy_filter(
        direccion_id=direccion_id,
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
        repositorio_id=repositorio_id,
    )

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

    severity_counts = {}
    for sev in ["CRITICA", "ALTA", "MEDIA", "BAJA"]:
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        Vulnerabilidad.severidad == sev,
                        Vulnerabilidad.deleted_at.is_(None),
                        *([hierarchy_filter] if hierarchy_filter is not None else []),
                    )
                )
            ).scalar_one()
            or 0
        )
        severity_counts[sev] = count

    engine_data = []
    for engine in ["SAST", "DAST", "SCA", "CDS", "MDA", "MAST"]:
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        Vulnerabilidad.fuente == engine,
                        Vulnerabilidad.deleted_at.is_(None),
                        *([hierarchy_filter] if hierarchy_filter is not None else []),
                    )
                )
            ).scalar_one()
            or 0
        )
        engine_data.append({"motor": engine, "count": count, "trend": 12})

    now = datetime.now(UTC)
    trend_data = []
    for month_offset in range(11, -1, -1):
        month_start = (now - timedelta(days=30 * (month_offset + 1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (now - timedelta(days=30 * month_offset)).replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(seconds=1)
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        Vulnerabilidad.created_at >= month_start,
                        Vulnerabilidad.created_at <= month_end,
                        Vulnerabilidad.deleted_at.is_(None),
                        *([hierarchy_filter] if hierarchy_filter is not None else []),
                    )
                )
            ).scalar_one()
            or 0
        )
        period = month_start.strftime("%b %Y")
        trend_data.append({"period": period, "count": count})

    pipeline = {}
    for state in ["Abierta", "En Progreso", "Remediada", "Cerrada"]:
        count = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        Vulnerabilidad.estado == state,
                        Vulnerabilidad.deleted_at.is_(None),
                        *([hierarchy_filter] if hierarchy_filter is not None else []),
                    )
                )
            ).scalar_one()
            or 0
        )
        pipeline[state] = count

    children = []
    children_type = None

    if not any([direccion_id, subdireccion_id, gerencia_id, organizacion_id, celula_id, repositorio_id]):
        subdirs = (
            await db.execute(
                select(
                    Subdireccion.id.label("id"),
                    Subdireccion.nombre.label("nombre"),
                    func.count(Vulnerabilidad.id).label("count"),
                )
                .select_from(Subdireccion)
                .outerjoin(Vulnerabilidad, Subdireccion.id == Vulnerabilidad.subdireccion_id)
                .where(Vulnerabilidad.deleted_at.is_(None))
                .group_by(Subdireccion.id)
                .order_by(func.count(Vulnerabilidad.id).desc())
            )
        ).all()
        children = [{"id": str(d.id), "name": d.nombre, "count": int(d.count or 0)} for d in subdirs]
        children_type = "subdireccion"
    elif subdireccion_id and not gerencia_id:
        gerencias = (
            await db.execute(
                select(
                    Gerencia.id.label("id"),
                    Gerencia.nombre.label("nombre"),
                    func.count(Vulnerabilidad.id).label("count"),
                )
                .select_from(Gerencia)
                .outerjoin(Vulnerabilidad, Gerencia.id == Vulnerabilidad.gerencia_id)
                .where(Gerencia.subdireccion_id == subdireccion_id, Vulnerabilidad.deleted_at.is_(None))
                .group_by(Gerencia.id)
                .order_by(func.count(Vulnerabilidad.id).desc())
            )
        ).all()
        children = [{"id": str(g.id), "name": g.nombre, "count": int(g.count or 0)} for g in gerencias]
        children_type = "gerencia"
    elif gerencia_id and not organizacion_id:
        organizaciones = (
            await db.execute(
                select(
                    Organizacion.id.label("id"),
                    Organizacion.nombre.label("nombre"),
                    func.count(Vulnerabilidad.id).label("count"),
                )
                .select_from(Organizacion)
                .outerjoin(Vulnerabilidad, Organizacion.id == Vulnerabilidad.organizacion_id)
                .where(Organizacion.gerencia_id == gerencia_id, Vulnerabilidad.deleted_at.is_(None))
                .group_by(Organizacion.id)
                .order_by(func.count(Vulnerabilidad.id).desc())
            )
        ).all()
        children = [{"id": str(o.id), "name": o.nombre, "count": int(o.count or 0)} for o in organizaciones]
        children_type = "organizacion"
    elif organizacion_id and not celula_id:
        celulas = (
            await db.execute(
                select(
                    Celula.id.label("id"),
                    Celula.nombre.label("nombre"),
                    func.count(Vulnerabilidad.id).label("count"),
                )
                .select_from(Celula)
                .outerjoin(Vulnerabilidad, Celula.id == Vulnerabilidad.celula_id)
                .where(Celula.organizacion_id == organizacion_id, Vulnerabilidad.deleted_at.is_(None))
                .group_by(Celula.id)
                .order_by(func.count(Vulnerabilidad.id).desc())
            )
        ).all()
        children = [{"id": str(c.id), "name": c.nombre, "count": int(c.count or 0)} for c in celulas]
        children_type = "celula"
    elif celula_id and not repositorio_id:
        repos = (
            await db.execute(
                select(
                    Repositorio.id.label("id"),
                    Repositorio.nombre.label("nombre"),
                    func.count(Vulnerabilidad.id).label("count"),
                )
                .select_from(Repositorio)
                .outerjoin(Vulnerabilidad, Repositorio.id == Vulnerabilidad.repositorio_id)
                .where(Repositorio.celula_id == celula_id, Vulnerabilidad.deleted_at.is_(None))
                .group_by(Repositorio.id)
                .order_by(func.count(Vulnerabilidad.id).desc())
            )
        ).all()
        children = [{"id": str(r.id), "name": r.nombre, "count": int(r.count or 0)} for r in repos]
        children_type = "repositorio"

    return success(
        {
            "summary": {
                "total": total,
                "by_engine": engine_data,
                "by_severity": severity_counts,
                "trend": trend_data,
                "pipeline": pipeline,
            },
            "children": children,
            "children_type": children_type,
            "applied_filters": _hierarchy_filter_dict(
                direccion_id=direccion_id,
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=organizacion_id,
                celula_id=celula_id,
                repositorio_id=repositorio_id,
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
    """Dashboard 1: Ejecutivo/General - High-level KPIs."""
    from app.models.vulnerabilidad import Vulnerabilidad

    hierarchy_filter = _vulnerability_hierarchy_filter(
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    vuln_total = int(
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

    sev_conds = [
        Vulnerabilidad.deleted_at.is_(None),
        *([hierarchy_filter] if hierarchy_filter is not None else []),
    ]
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

    by_severity: dict[str, int] = {}
    for label in ("Critica", "Alta", "Media", "Baja", "Informativa"):
        n = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        func.lower(Vulnerabilidad.severidad) == label.lower(),
                        *sev_conds,
                    )
                )
            ).scalar_one()
            or 0
        )
        by_severity[label] = n

    now = datetime.now(UTC)
    week_ago = now - timedelta(days=7)
    new_7d = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    Vulnerabilidad.created_at >= week_ago,
                    *sev_conds,
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
            "by_severity": by_severity,
            "trend": {
                "new_vulnerabilities_7d": new_7d,
            },
            "risk_level": "MEDIUM" if vuln_critica > 5 else "LOW",
            "applied_filters": _hierarchy_filter_dict(
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=organizacion_id,
                celula_id=celula_id,
            ),
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


@router.get("/concentrado")
async def dashboard_concentrado(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 5: Concentrado - aggregated vulnerability view by motor and severity."""
    from app.models.vulnerabilidad import Vulnerabilidad
    from sqlalchemy import func
    from sqlalchemy.orm import aliased

    # Get vulnerabilities grouped by motor (fuente)
    motors_result = await db.execute(
        select(
            Vulnerabilidad.fuente,
            func.count(Vulnerabilidad.id).label("total"),
            func.sum(func.cast(Vulnerabilidad.estado == 'Cerrada', Integer)).label("closed"),
        )
        .group_by(Vulnerabilidad.fuente)
    )

    motors_rows = motors_result.all()
    motors = []
    for row in motors_rows:
        total = row.total or 0
        closed = row.closed or 0
        motors.append({
            "motor": row.fuente or "Unknown",
            "total": total,
            "closed": closed,
            "percentage": round((closed / total * 100) if total > 0 else 0, 1),
        })

    # Get vulnerabilities grouped by severity
    severity_result = await db.execute(
        select(
            Vulnerabilidad.severidad,
            func.count(Vulnerabilidad.id).label("count"),
        )
        .group_by(Vulnerabilidad.severidad)
    )

    severity_rows = severity_result.all()
    total_vulns = sum(row.count for row in severity_rows)
    severities = []
    for row in severity_rows:
        count = row.count or 0
        severities.append({
            "severity": row.severidad or "Unknown",
            "count": count,
            "percentage": round((count / total_vulns * 100) if total_vulns > 0 else 0, 1),
        })

    # Get total and active counts
    total_active = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(Vulnerabilidad.estado != 'Cerrada')
            )
        ).scalar()
    )

    # Get pipeline stages
    pipeline_result = await db.execute(
        select(
            Vulnerabilidad.etapa_pipeline,
            func.count(Vulnerabilidad.id).label("count"),
        )
        .where(Vulnerabilidad.etapa_pipeline.isnot(None))
        .group_by(Vulnerabilidad.etapa_pipeline)
    )

    pipeline_rows = pipeline_result.all()
    pipeline_stages = {row.etapa_pipeline: row.count for row in pipeline_rows}

    return success(
        {
            "motors": sorted(motors, key=lambda x: x["total"], reverse=True),
            "severities": sorted(
                severities,
                key=lambda x: ["Critica", "Alta", "Media", "Baja", "Informativa"].index(x["severity"]),
            ),
            "total_vulnerabilities": total_vulns,
            "total_active": total_active,
            "pipeline_stages": pipeline_stages,
        }
    )


@router.get("/programs/heatmap")
async def dashboard_programs_heatmap(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 3 helper: heatmap mensual de avance por programa (motor)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    now = datetime.now(UTC)
    year = now.year
    motors = ["SAST", "DAST", "SCA", "CDS", "MDA", "MAST"]
    heatmap: dict[str, list[dict]] = {}

    for motor in motors:
        months: list[dict] = []
        for m in range(1, 13):
            month_start = datetime(year, m, 1, tzinfo=UTC)
            if m == 12:
                next_start = datetime(year + 1, 1, 1, tzinfo=UTC)
            else:
                next_start = datetime(year, m + 1, 1, tzinfo=UTC)

            total = int(
                (
                    await db.execute(
                        select(func.count())
                        .select_from(Vulnerabilidad)
                        .where(
                            Vulnerabilidad.fuente == motor,
                            Vulnerabilidad.created_at >= month_start,
                            Vulnerabilidad.created_at < next_start,
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
                            Vulnerabilidad.fuente == motor,
                            Vulnerabilidad.estado == "Cerrada",
                            Vulnerabilidad.created_at >= month_start,
                            Vulnerabilidad.created_at < next_start,
                            Vulnerabilidad.deleted_at.is_(None),
                        )
                    )
                ).scalar_one()
                or 0
            )
            value = int((closed / total * 100) if total > 0 else 0)
            months.append(
                {
                    "month": m,
                    "value": value,
                    "total": total,
                    "closed": closed,
                }
            )
        heatmap[motor] = months

    return success({"heatmap": heatmap, "year": year})
