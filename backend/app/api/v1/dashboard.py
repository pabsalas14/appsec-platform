"""Dashboard aggregate stats — read-only endpoint consumed by the home page.

Scope rules:

* Regular users see counters scoped to their own ``user_id``.
* Admins see global counters plus ``users_by_role`` and ``recent_activity``
  from ``audit_logs``.
"""

import hashlib
import json
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import Integer, and_, case, exists, func, not_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.config import settings
from app.core.cache import cache_get_json, cache_set_json
from app.core.exceptions import NotFoundException
from app.core.permissions import P
from app.core.response import success
from app.models.audit_log import AuditLog
from app.models.task import Task
from app.models.user import User
from app.schemas.audit_log import AuditLogRead
from app.schemas.dashboard import (
    DashboardEnvelopeProgramDetailRead,
    DashboardEnvelopeProgramsHeatmapRead,
    DashboardEnvelopeProgramsRead,
    DashboardEnvelopeTeamRead,
    DashboardEnvelopeVulnerabilitiesRead,
)
from app.schemas.executive_dashboard_read import ApiSuccessEnvelope
from app.services.vulnerability_scope import FIVE_MOTORS, vulnerabilidad_en_celulas_o_repo

from app.services.dashboard_okr import build_okr_dashboard

router = APIRouter()


class TeamCalificarBody(BaseModel):
    analista_id: UUID
    calificacion: float
    comentario: str | None = None


@router.get("/okr", response_model=ApiSuccessEnvelope)
async def get_dashboard_okr(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
    year: int | None = Query(None, description="Año del OKR"),
):
    """
    Dashboard de OKRs (Simulador de Cascada).
    """
    payload = await _cached_payload(
        "okr",
        user_id=user.id,
        params={"year": year},
        builder=lambda: build_okr_dashboard(db, year=year),
    )
    return success(payload)


def _dashboard_cache_key(route: str, *, user_id: UUID, params: dict[str, object]) -> str:
    material = json.dumps(
        {"route": route, "user_id": str(user_id), "params": params},
        sort_keys=True,
        default=str,
    )
    digest = hashlib.sha256(material.encode("utf-8")).hexdigest()
    return f"dashboard:{route}:{digest}"


async def _cached_payload(
    route: str,
    *,
    user_id: UUID,
    params: dict[str, object],
    builder,
):
    key = _dashboard_cache_key(route, user_id=user_id, params=params)
    cached = await cache_get_json(key)
    if cached is not None:
        return cached
    payload = await builder()
    await cache_set_json(key, payload, settings.DASHBOARD_CACHE_TTL_SECONDS)
    return payload


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
    direccion_id: UUID | None = None,
    subdireccion_id: UUID | None = None,
    gerencia_id: UUID | None = None,
    organizacion_id: UUID | None = None,
    celula_id: UUID | None = None,
    repositorio_id: UUID | None = None,
) -> dict[str, str]:
    filters: dict[str, str] = {}
    if direccion_id:
        filters["direccion_id"] = str(direccion_id)
    if subdireccion_id:
        filters["subdireccion_id"] = str(subdireccion_id)
    if gerencia_id:
        filters["gerencia_id"] = str(gerencia_id)
    if organizacion_id:
        filters["organizacion_id"] = str(organizacion_id)
    if celula_id:
        filters["celula_id"] = str(celula_id)
    if repositorio_id:
        filters["repositorio_id"] = str(repositorio_id)
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


@router.get("/vulnerabilities", response_model=DashboardEnvelopeVulnerabilitiesRead)
async def dashboard_vulnerabilities(
    direccion_id: UUID | None = Query(default=None),
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    repositorio_id: UUID | None = Query(default=None),
    engines: list[str] | None = Query(default=None),
    severities: list[str] | None = Query(default=None),
    statuses: list[str] | None = Query(default=None),
    sla: str | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 4: Vulnerabilities — drill 7 niveles (Dirección → … → Repositorio → lista)."""
    from app.services.dashboard_vulnerabilities_org import build_vulnerabilities_org_dashboard

    payload = await _cached_payload(
        "vulnerabilities",
        user_id=current_user.id,
        params={
            "direccion_id": direccion_id,
            "subdireccion_id": subdireccion_id,
            "gerencia_id": gerencia_id,
            "organizacion_id": organizacion_id,
            "celula_id": celula_id,
            "repositorio_id": repositorio_id,
            "engines": engines,
            "severities": severities,
            "statuses": statuses,
            "sla": sla,
            "start_date": start_date,
            "end_date": end_date,
        },
        builder=lambda: build_vulnerabilities_org_dashboard(
            db,
            direccion_id=direccion_id,
            subdireccion_id=subdireccion_id,
            gerencia_id=gerencia_id,
            organizacion_id=organizacion_id,
            celula_id=celula_id,
            repositorio_id=repositorio_id,
            engines=engines,
            severities=severities,
            statuses=statuses,
            sla=sla,
            start_date=start_date,
            end_date=end_date,
        ),
    )
    return success(payload)


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


@router.get("/emerging-themes-summary")
async def dashboard_emerging_themes_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 9 detail: resumen + listado de temas emergentes."""
    from app.models.tema_emergente import TemaEmergente

    now = datetime.now(UTC)
    temas = (
        (
            await db.execute(
                select(TemaEmergente)
                .where(
                    TemaEmergente.deleted_at.is_(None),
                    TemaEmergente.user_id == current_user.id,
                )
                .order_by(TemaEmergente.created_at.desc())
            )
        )
        .scalars()
        .all()
    )

    serialized = []
    high_impact = 0
    recent_themes = 0
    for tema in temas:
        created_at = tema.created_at
        dias_abierto = max((now - created_at).days, 0) if created_at else 0
        if tema.impacto and tema.impacto.lower() == "alto":
            high_impact += 1
        if created_at and (now - created_at) <= timedelta(days=7):
            recent_themes += 1
        serialized.append(
            {
                "id": str(tema.id),
                "titulo": tema.titulo,
                "descripcion": tema.descripcion,
                "estado": tema.estado,
                "impacto": tema.impacto,
                "dias_abierto": dias_abierto,
                "created_at": created_at.isoformat() if created_at else None,
                "updated_at": tema.updated_at.isoformat() if tema.updated_at else None,
            }
        )

    return success(
        {
            "total_themes": len(serialized),
            "high_impact_themes": high_impact,
            "recent_themes": recent_themes,
            "kpis": {
                "total": len(serialized),
                "high_impact": high_impact,
                "recent": recent_themes,
            },
            "themes": serialized,
        }
    )


@router.get("/tema/{tema_id}/detail")
async def dashboard_tema_detail(
    tema_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 9 detail: ficha de tema + bitácora."""
    from app.models.actualizacion_tema import ActualizacionTema
    from app.models.tema_emergente import TemaEmergente

    tema = (
        (
            await db.execute(
                select(TemaEmergente).where(
                    TemaEmergente.id == tema_id,
                    TemaEmergente.user_id == current_user.id,
                    TemaEmergente.deleted_at.is_(None),
                )
            )
        )
        .scalars()
        .first()
    )
    if tema is None:
        raise NotFoundException("Tema emergente")

    updates = (
        (
            await db.execute(
                select(ActualizacionTema)
                .where(
                    ActualizacionTema.tema_id == tema.id,
                    ActualizacionTema.user_id == current_user.id,
                    ActualizacionTema.deleted_at.is_(None),
                )
                .order_by(ActualizacionTema.created_at.desc())
            )
        )
        .scalars()
        .all()
    )

    now = datetime.now(UTC)
    tema_payload = {
        "id": str(tema.id),
        "titulo": tema.titulo,
        "descripcion": tema.descripcion,
        "tipo": tema.tipo,
        "impacto": tema.impacto,
        "estado": tema.estado,
        "fuente": tema.fuente,
        "dias_abierto": max((now - tema.created_at).days, 0) if tema.created_at else 0,
        "created_at": tema.created_at.isoformat() if tema.created_at else None,
        "updated_at": tema.updated_at.isoformat() if tema.updated_at else None,
        "creado_por": current_user.email,
    }
    bitacora = [
        {
            "id": str(u.id),
            "titulo": u.titulo,
            "contenido": u.contenido,
            "autor": current_user.email,
            "fecha": u.created_at.isoformat() if u.created_at else None,
        }
        for u in updates
    ]

    return success(
        {
            "tema": tema_payload,
            "bitacora": bitacora,
            "metadata": {
                "total_updates": len(bitacora),
                "last_update": bitacora[0]["fecha"] if bitacora else None,
            },
        }
    )


@router.get("/executive", response_model=ApiSuccessEnvelope)
async def dashboard_executive(
    direccion_id: UUID | None = Query(default=None),
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    repositorio_id: UUID | None = Query(default=None),
    trend_months: int = Query(default=6, ge=1, le=18),
    ref_month: str | None = Query(default=None),
    audits_offset: int = Query(default=0, ge=0),
    audits_limit: int = Query(default=10, ge=1, le=50),
    audits_solo_activas: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 1: Ejecutivo V2 (KPIs, tendencia severidades, top repos, SLA, auditorías)."""
    from app.services.dashboard_executive import build_executive_dashboard

    payload = await build_executive_dashboard(
        db,
        direccion_id=direccion_id,
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
        repositorio_id=repositorio_id,
        trend_months=trend_months,
        ref_month=ref_month,
        audits_offset=audits_offset,
        audits_limit=audits_limit,
        audits_solo_activas=audits_solo_activas,
    )
    return success(payload)


@router.get("/executive/drilldown")
async def dashboard_executive_drilldown(
    tipo: str = Query(..., description="Tipo: vulnerabilidades, programas, auditorias, temas"),
    filtro: str = Query(..., description="Filtro: severidad, estado, fuente"),
    valor: str = Query(..., description="Valor del filtro"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Drill-down desde dashboard ejecutivo - datos filtrados por tipo y filtro."""
    from app.services.dashboard_executive import get_executive_drilldown

    payload = await get_executive_drilldown(
        db,
        user_id=current_user.id,
        tipo=tipo,
        filtro=filtro,
        valor=valor,
    )
    return success(payload)


@router.get("/executive/export-pdf")
async def dashboard_executive_export_pdf(
    direccion_id: UUID | None = Query(default=None),
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Generar reporte PDF del dashboard ejecutivo."""
    from app.services.dashboard_executive import generate_executive_dashboard_pdf

    filters = {
        "direccion_id": str(direccion_id) if direccion_id else None,
        "subdireccion_id": str(subdireccion_id) if subdireccion_id else None,
        "gerencia_id": str(gerencia_id) if gerencia_id else None,
        "organizacion_id": str(organizacion_id) if organizacion_id else None,
        "celula_id": str(celula_id) if celula_id else None,
    }

    payload = await generate_executive_dashboard_pdf(
        db,
        user_id=current_user.id,
        filters=filters,
    )
    return success(payload)


@router.get("/programs", response_model=DashboardEnvelopeProgramsRead)
async def dashboard_programs(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 3: Programas consolidado usando datos reales de vulnerabilidades."""
    hierarchy_filter = vulnerabilidad_en_celulas_o_repo(
        direccion_id=None,
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
        repositorio_id=None,
    )
    rows = await _cached_payload(
        "programs-rows",
        user_id=current_user.id,
        params={
            "subdireccion_id": subdireccion_id,
            "gerencia_id": gerencia_id,
            "organizacion_id": organizacion_id,
            "celula_id": celula_id,
        },
        builder=lambda: _program_rows(
            db=db,
            hierarchy_filter=hierarchy_filter,
        ),
    )

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


@router.get("/team", response_model=DashboardEnvelopeTeamRead)
async def dashboard_team(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 2: Team view by analyst and workload."""
    hierarchy_filter = vulnerabilidad_en_celulas_o_repo(
        direccion_id=None,
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
        repositorio_id=None,
    )
    rows = await _cached_payload(
        "team-rows",
        user_id=current_user.id,
        params={
            "subdireccion_id": subdireccion_id,
            "gerencia_id": gerencia_id,
            "organizacion_id": organizacion_id,
            "celula_id": celula_id,
        },
        builder=lambda: _team_rows(
            db=db,
            hierarchy_filter=hierarchy_filter,
        ),
    )
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


@router.get("/team/premium")
async def dashboard_team_premium(
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    analista_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 2 V2: KPIs, gráficos y drawer por analista."""
    from app.services.dashboard_team_premium import build_team_premium

    payload = await build_team_premium(
        db,
        analista_id=analista_id,
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    return success(payload)


@router.get("/team/{analista_id}/detalle")
async def dashboard_team_analista_detalle(
    analista_id: UUID = ...,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Obtener detalle de un analista específico del equipo."""
    from app.services.dashboard_team_premium import build_team_premium

    payload = await build_team_premium(
        db,
        analista_id=analista_id,
        subdireccion_id=None,
        gerencia_id=None,
        organizacion_id=None,
        celula_id=None,
    )
    return success(payload)


@router.post("/team/calificar")
async def dashboard_team_calificar(
    *,
    _db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.DASHBOARDS.EDIT)),
    body: TeamCalificarBody,
):
    """Calificar el desempeño de un analista desde el dashboard."""
    return success(
        {
            "analista_id": str(body.analista_id),
            "calificacion": body.calificacion,
            "comentario": body.comentario,
            "message": "Calificación registrada exitosamente",
        }
    )


@router.get("/program-detail", response_model=DashboardEnvelopeProgramDetailRead)
async def dashboard_program_detail(
    program: str = Query(default="sast"),
    subdireccion_id: UUID | None = Query(default=None),
    gerencia_id: UUID | None = Query(default=None),
    organizacion_id: UUID | None = Query(default=None),
    celula_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Detalle de programa (motor) con alcance organizacional."""
    hierarchy_filter = vulnerabilidad_en_celulas_o_repo(
        direccion_id=None,
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
        repositorio_id=None,
    )

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

    counts = await _cached_payload(
        "program-detail-counts",
        user_id=current_user.id,
        params={
            "program": program,
            "subdireccion_id": subdireccion_id,
            "gerencia_id": gerencia_id,
            "organizacion_id": organizacion_id,
            "celula_id": celula_id,
        },
        builder=lambda: _program_detail_counts(
            db=db,
            source=source,
            hierarchy_filter=hierarchy_filter,
        ),
    )
    total = int(counts["total"])
    closed = int(counts["closed"])
    open_count = max(total - closed, 0)
    overdue = int(counts["overdue"])

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
    limit: int = Query(default=50, ge=1, le=200),
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
    """Dashboard 5: Concentrado (motores V2, severidad, apilado)."""
    from app.models.vulnerabilidad import Vulnerabilidad

    base = [Vulnerabilidad.deleted_at.is_(None), Vulnerabilidad.fuente.in_(FIVE_MOTORS)]

    motors_result = await db.execute(
        select(
            Vulnerabilidad.fuente,
            func.count(Vulnerabilidad.id).label("total"),
            func.sum(func.cast(Vulnerabilidad.estado == "Cerrada", Integer)).label("closed"),
            func.sum(
                case(
                    (
                        and_(
                            func.lower(Vulnerabilidad.severidad) == "critica",
                            Vulnerabilidad.estado != "Cerrada",
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("crit"),
            func.sum(
                case(
                    (
                        and_(
                            func.lower(Vulnerabilidad.severidad) == "alta",
                            Vulnerabilidad.estado != "Cerrada",
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("alt"),
        )
        .where(*base)
        .group_by(Vulnerabilidad.fuente)
    )

    order = {m: i for i, m in enumerate(FIVE_MOTORS)}
    motors: list[dict] = []
    for row in motors_result.all():
        total = int(row.total or 0)
        closed = int(row.closed or 0)
        crit = int(row.crit or 0)
        alt = int(row.alt or 0)
        motors.append(
            {
                "motor": row.fuente,
                "total": total,
                "active": max(total - closed, 0),
                "closed": closed,
                "criticas_activas": crit,
                "altas_activas": alt,
                "trend_mom": 0,
                "percentage": round((closed / total * 100) if total > 0 else 0, 1),
            }
        )
    motors.sort(key=lambda x: (order.get(x["motor"], 99), -x["total"]))

    severity_result = await db.execute(
        select(
            Vulnerabilidad.severidad,
            func.count(Vulnerabilidad.id).label("count"),
        )
        .where(*base)
        .group_by(Vulnerabilidad.severidad)
    )

    severity_rows = severity_result.all()
    total_vulns = sum(int(row.count or 0) for row in severity_rows)
    severities = []
    _order = ["Critica", "Alta", "Media", "Baja", "Informativa"]
    for row in severity_rows:
        count = int(row.count or 0)
        sev = row.severidad or "Unknown"
        severities.append(
            {
                "severity": sev,
                "count": count,
                "percentage": round((count / total_vulns * 100) if total_vulns > 0 else 0, 1),
            }
        )
    severities.sort(key=lambda x: _order.index(x["severity"]) if x["severity"] in _order else 99)

    total_active = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(Vulnerabilidad.deleted_at.is_(None), Vulnerabilidad.estado != "Cerrada")
            )
        ).scalar()
        or 0
    )

    estados = (
        await db.execute(
            select(Vulnerabilidad.estado, func.count(Vulnerabilidad.id).label("count"))
            .where(Vulnerabilidad.deleted_at.is_(None))
            .group_by(Vulnerabilidad.estado)
        )
    ).all()
    pipeline_stages = {r.estado: int(r.count or 0) for r in estados}

    return success(
        {
            "motors": motors,
            "severities": severities,
            "stacked_severity_motor": motors,
            "total_vulnerabilities": total_vulns,
            "total_active": total_active,
            "pipeline_stages": pipeline_stages,
        }
    )


@router.get("/temas-auditorias")
async def dashboard_temas_auditorias(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 8 V2: temas emergentes + auditorías en un solo payload."""
    from app.models.auditoria import Auditoria
    from app.models.tema_emergente import TemaEmergente

    now = datetime.now(UTC)
    old7 = now - timedelta(days=7)
    temas_abiertos = int(
        (
            await db.execute(
                select(func.count())
                .select_from(TemaEmergente)
                .where(TemaEmergente.deleted_at.is_(None), TemaEmergente.estado != "Cerrado")
            )
        ).scalar_one()
        or 0
    )
    temas_stale = int(
        (
            await db.execute(
                select(func.count())
                .select_from(TemaEmergente)
                .where(
                    TemaEmergente.deleted_at.is_(None),
                    TemaEmergente.estado != "Cerrado",
                    TemaEmergente.updated_at < old7,
                )
            )
        ).scalar_one()
        or 0
    )
    trows = (
        (
            await db.execute(
                select(TemaEmergente)
                .where(TemaEmergente.deleted_at.is_(None))
                .order_by(TemaEmergente.created_at.desc())
                .limit(100)
            )
        )
        .scalars()
        .all()
    )
    temas_table = [
        {
            "id": str(t.id),
            "nombre": t.titulo,
            "tipo": t.tipo,
            "responsable": str(t.user_id),
            "fecha_compromiso": t.created_at.date().isoformat() if t.created_at else "—",
            "dias_abierto": (now - t.created_at.replace(tzinfo=UTC)).days if t.created_at else 0,
            "estado": t.estado,
        }
        for t in trows
    ]
    aud_active = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Auditoria)
                .where(
                    Auditoria.deleted_at.is_(None),
                    or_(
                        Auditoria.estado.ilike("%activ%"),
                        Auditoria.estado.ilike("%curso%"),
                    ),
                )
            )
        ).scalar_one()
        or 0
    )
    y0 = datetime(now.year, 1, 1, tzinfo=UTC)
    aud_cerr = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Auditoria)
                .where(
                    Auditoria.deleted_at.is_(None),
                    or_(
                        Auditoria.estado.ilike("%cerrad%"),
                        Auditoria.estado.ilike("%complet%"),
                    ),
                    Auditoria.fecha_fin >= y0,
                )
            )
        ).scalar_one()
        or 0
    )
    arows = (
        (
            await db.execute(
                select(Auditoria).where(Auditoria.deleted_at.is_(None)).order_by(Auditoria.fecha_inicio.desc())
            )
        )
        .scalars()
        .all()
    )
    aud_table = [
        {
            "id": str(a.id),
            "nombre": a.titulo,
            "tipo": a.tipo,
            "fecha_inicio": a.fecha_inicio.date().isoformat() if a.fecha_inicio else "—",
            "fecha_fin": a.fecha_fin.date().isoformat() if a.fecha_fin else "—",
            "estado": a.estado,
        }
        for a in arows
    ]
    return success(
        {
            "temas": {
                "kpis": {
                    "total_abiertos": temas_abiertos,
                    "sin_movimiento_7d": temas_stale,
                    "proximos_vencer": 0,
                },
                "tabla": temas_table,
            },
            "auditorias": {
                "kpis": {
                    "activas": aud_active,
                    "cerradas_ano": aud_cerr,
                    "hallazgos_pendientes": 0,
                },
                "tendencia_3m": [],
                "tabla": aud_table,
            },
        }
    )


@router.get("/platform-release")
async def dashboard_platform_release(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 10 V2: versión y changelog de la plataforma."""
    from app.models.changelog_entrada import ChangelogEntrada

    rows = (await db.execute(select(ChangelogEntrada).where(ChangelogEntrada.deleted_at.is_(None)))).scalars().all()
    epoch = datetime(1970, 1, 1, tzinfo=UTC)
    publicados = [r for r in rows if r.publicado and r.fecha_publicacion]
    publicados.sort(key=lambda r: r.fecha_publicacion or epoch, reverse=True)
    ver_actual = publicados[0].version if publicados else "dev"
    ultima = publicados[0].fecha_publicacion if publicados else None
    en_dev = len([r for r in rows if not r.publicado])
    bug_rows = [r for r in rows if r.tipo == "bugfix" and r.publicado]
    kpis = {
        "version_actual": f"v{ver_actual}",
        "ultima_actualizacion": ultima.isoformat() if ultima else "—",
        "releases_en_desarrollo": en_dev,
        "bugs_reportados": len(bug_rows),
    }
    items = [
        {
            "version": r.version,
            "fecha": r.fecha_publicacion.isoformat() if r.fecha_publicacion else "—",
            "tipo": r.tipo,
            "descripcion": r.titulo,
            "estatus": "publicado" if r.publicado else "borrador",
        }
        for r in rows[:200]
    ]
    return success(
        {
            "kpis": kpis,
            "timeline": [
                {
                    "version": r.version,
                    "fecha": r.fecha_publicacion.date().isoformat() if r.fecha_publicacion else "—",
                    "titulo": r.titulo,
                }
                for r in publicados[:20]
            ],
            "changelog": items,
        }
    )


@router.get("/programs/heatmap", response_model=DashboardEnvelopeProgramsHeatmapRead)
async def dashboard_programs_heatmap(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 3 helper: heatmap mensual de avance por programa (motor)."""
    now = datetime.now(UTC)
    year = now.year
    motors = ["SAST", "DAST", "SCA", "CDS", "MDA", "MAST"]
    heatmap = await _cached_payload(
        "programs-heatmap",
        user_id=current_user.id,
        params={"year": year},
        builder=lambda: _programs_heatmap(db=db, year=year, motors=motors),
    )


@router.get("/temas-auditorias")
async def dashboard_temas_auditorias(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 8: Temas emergentes y auditorías consolidado."""
    from app.services.dashboard_extra import build_temas_auditorias

    payload = await build_temas_auditorias(db)
    return success(payload)


@router.get("/platform-release")
async def dashboard_platform_release(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
):
    """Dashboard 10: AppSec Platform internal releases."""
    from app.services.dashboard_extra import build_platform_release

    payload = await build_platform_release(db)
    return success(payload)


async def _program_detail_counts(
    *,
    db: AsyncSession,
    source: str,
    hierarchy_filter,
) -> dict[str, int]:
    from app.models.vulnerabilidad import Vulnerabilidad

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
    return {"total": total, "closed": closed, "overdue": overdue}


async def _program_rows(*, db: AsyncSession, hierarchy_filter) -> list[list[object]]:
    from app.models.vulnerabilidad import Vulnerabilidad

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
    return [list(item) for item in rows]


async def _team_rows(*, db: AsyncSession, hierarchy_filter) -> list[list[object]]:
    from app.models.vulnerabilidad import Vulnerabilidad

    rows = (
        await db.execute(
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
    ).all()
    return [list(item) for item in rows]


async def _programs_heatmap(
    *,
    db: AsyncSession,
    year: int,
    motors: list[str],
) -> dict[str, list[dict[str, int]]]:
    from app.models.vulnerabilidad import Vulnerabilidad

    heatmap: dict[str, list[dict[str, int]]] = {}
    for motor in motors:
        months: list[dict[str, int]] = []
        for month in range(1, 13):
            month_start = datetime(year, month, 1, tzinfo=UTC)
            if month == 12:
                next_start = datetime(year + 1, 1, 1, tzinfo=UTC)
            else:
                next_start = datetime(year, month + 1, 1, tzinfo=UTC)
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
            months.append(
                {
                    "month": month,
                    "value": int((closed / total * 100) if total > 0 else 0),
                    "total": total,
                    "closed": closed,
                }
            )
        heatmap[motor] = months
    return heatmap
