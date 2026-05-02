"""Construcción de payload `GET /api/v1/dashboard/executive` (Dashboard 1 V2)."""

from __future__ import annotations

import calendar
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auditoria import Auditoria
from app.models.hito_iniciativa import HitoIniciativa
from app.models.iniciativa import Iniciativa
from app.models.repositorio import Repositorio
from app.models.service_release import ServiceRelease
from app.models.tema_emergente import TemaEmergente
from app.models.vulnerabilidad import Vulnerabilidad
from app.services.vulnerability_scope import FIVE_MOTORS, vulnerabilidad_en_celulas_o_repo


def _hierarchy_dict(
    *,
    direccion_id: UUID | None,
    subdireccion_id: UUID | None,
    gerencia_id: UUID | None,
    organizacion_id: UUID | None,
    celula_id: UUID | None,
    repositorio_id: UUID | None,
) -> dict[str, str]:
    d: dict[str, str] = {}
    if direccion_id:
        d["direccion_id"] = str(direccion_id)
    if subdireccion_id:
        d["subdireccion_id"] = str(subdireccion_id)
    if gerencia_id:
        d["gerencia_id"] = str(gerencia_id)
    if organizacion_id:
        d["organizacion_id"] = str(organizacion_id)
    if celula_id:
        d["celula_id"] = str(celula_id)
    if repositorio_id:
        d["repositorio_id"] = str(repositorio_id)
    return d


def _is_release_active_row(estado: str | None) -> bool:
    e = (estado or "").lower()
    if not e:
        return True
    terminal = ("producción", "produccion", "cancelad", "cerrad", "completad", "desplegad")
    return not any(t in e for t in terminal)


def _activa_vuln_conds() -> list:
    return [Vulnerabilidad.deleted_at.is_(None), Vulnerabilidad.estado != "Cerrada"]


async def build_executive_dashboard(
    db: AsyncSession,
    *,
    direccion_id: UUID | None,
    subdireccion_id: UUID | None,
    gerencia_id: UUID | None,
    organizacion_id: UUID | None,
    celula_id: UUID | None,
    repositorio_id: UUID | None,
    trend_months: int,
    ref_month: str | None,
    audits_offset: int,
    audits_limit: int,
    audits_solo_activas: bool,
) -> dict:
    scope = vulnerabilidad_en_celulas_o_repo(
        direccion_id=direccion_id,
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
        repositorio_id=repositorio_id,
    )
    vbase = [Vulnerabilidad.deleted_at.is_(None)]
    if scope is not None:
        vbase.append(scope)

    now = datetime.now(UTC)
    tm = max(1, min(trend_months, 18))

    # --- Programas: avance medio (cerradas / total) en motores V2 ---
    progs: list[int] = []
    for motor in FIVE_MOTORS:
        tot = int(
            (
                await db.execute(
                    select(func.count()).select_from(Vulnerabilidad).where(*vbase, Vulnerabilidad.fuente == motor)
                )
            ).scalar_one()
            or 0
        )
        clo = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(*vbase, Vulnerabilidad.fuente == motor, Vulnerabilidad.estado == "Cerrada")
                )
            ).scalar_one()
            or 0
        )
        progs.append(int((clo / tot * 100) if tot else 0))
    programs_advancement = int(sum(progs) / len(progs)) if progs else 0

    crit_active = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    *vbase,
                    *_activa_vuln_conds(),
                    func.lower(Vulnerabilidad.severidad) == "critica",
                )
            )
        ).scalar_one()
        or 0
    )
    # releases "activas"
    r_rows = (
        await db.execute(
            select(ServiceRelease.nombre, ServiceRelease.estado_actual).where(ServiceRelease.deleted_at.is_(None))
        )
    ).all()
    active_releases = sum(1 for _n, st in r_rows if _is_release_active_row(st))
    # SLA riesgo releases (próximos 3 días) — aprox: estado no terminal y jira o fecha
    at_risk_releases = 0
    for _n, st in r_rows:
        if _is_release_active_row(st) and st and "riesgo" in st.lower():
            at_risk_releases += 1
    if at_risk_releases == 0 and active_releases:
        at_risk_releases = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(ServiceRelease)
                    .where(
                        ServiceRelease.deleted_at.is_(None),
                        or_(
                            ServiceRelease.estado_actual.ilike("%observac%"),
                            ServiceRelease.estado_actual.ilike("%validac%"),
                        ),
                    )
                )
            ).scalar_one()
            or 0
        )

    # Temas abiertos
    emerging = int(
        (
            await db.execute(
                select(func.count())
                .select_from(TemaEmergente)
                .where(
                    TemaEmergente.deleted_at.is_(None),
                    TemaEmergente.estado != "Cerrado",
                )
            )
        ).scalar_one()
        or 0
    )
    # Auditorías activas
    audits_active = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Auditoria)
                .where(
                    Auditoria.deleted_at.is_(None),
                    or_(
                        Auditoria.estado.ilike("%activ%"),
                        Auditoria.estado.ilike("%curso%"),
                        Auditoria.estado.ilike("%progres%"),
                    ),
                )
            )
        ).scalar_one()
        or 0
    )

    # Iniciativas activas y avance promedio (§13.3)
    ini_filters = [Iniciativa.deleted_at.is_(None), Iniciativa.estado != "Completada"]
    if celula_id:
        ini_filters.append(Iniciativa.celula_id == celula_id)
    
    initiatives_active = int(
        (await db.execute(select(func.count()).select_from(Iniciativa).where(*ini_filters))).scalar_one() or 0
    )
    
    initiatives_advancement = 0
    if initiatives_active > 0:
        ini_ids = (await db.execute(select(Iniciativa.id).where(*ini_filters))).scalars().all()
        h_stmt = select(func.avg(HitoIniciativa.porcentaje_completado)).where(
            HitoIniciativa.iniciativa_id.in_(ini_ids),
            HitoIniciativa.deleted_at.is_(None)
        )
        initiatives_advancement = int((await db.execute(h_stmt)).scalar_one() or 0)

    posture = max(0, min(100, 100 - min(crit_active * 8, 80)))
    if crit_active == 0 and programs_advancement >= 80:
        posture = min(100, posture + 10)

    risk = "BAJO" if crit_active < 3 else "MEDIO" if crit_active < 10 else "ALTO"

    # Tendencia por mes calendario (últimos tm meses): severidades (abiertas a fin de ventana aproximada)
    trend_data: list[dict] = []
    year_month_cursor = now
    for i in range(tm - 1, -1, -1):
        dt = year_month_cursor - timedelta(days=28 * i)
        mstart = dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last = calendar.monthrange(mstart.year, mstart.month)[1]
        mend = mstart.replace(day=last, hour=23, minute=59, second=59, microsecond=999999)
        label = mstart.strftime("%b %Y")
        td: dict = {"name": label}
        for sev_l, sev in (
            ("criticas", "Critica"),
            ("altas", "Alta"),
            ("medias", "Media"),
            ("bajas", "Baja"),
        ):
            c = int(
                (
                    await db.execute(
                        select(func.count())
                        .select_from(Vulnerabilidad)
                        .where(
                            *vbase,
                            Vulnerabilidad.severidad == sev,
                            Vulnerabilidad.estado != "Cerrada",
                            Vulnerabilidad.created_at <= mend,
                        )
                    )
                ).scalar_one()
                or 0
            )
            td[sev_l] = c
        trend_data.append(td)

    # Top repos con críticas
    sub_top = (
        select(Repositorio.nombre, func.count(Vulnerabilidad.id).label("c"))
        .join(Vulnerabilidad, Vulnerabilidad.repositorio_id == Repositorio.id)
        .where(
            Repositorio.deleted_at.is_(None),
            *vbase,
            func.lower(Vulnerabilidad.severidad) == "critica",
            Vulnerabilidad.estado != "Cerrada",
        )
        .group_by(Repositorio.nombre)
        .order_by(func.count(Vulnerabilidad.id).desc())
        .limit(5)
    )
    tr = (await db.execute(sub_top)).all()
    top_repos = [{"label": n, "value": int(c or 0), "color": "#ef4444"} for n, c in tr]

    # Críticos por motor (KPI sub)
    by_fuente: list[dict] = []
    for m in FIVE_MOTORS:
        n = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        *vbase,
                        Vulnerabilidad.fuente == m,
                        func.lower(Vulnerabilidad.severidad) == "critica",
                        Vulnerabilidad.estado != "Cerrada",
                    )
                )
            ).scalar_one()
            or 0
        )
        by_fuente.append({"fuente": m, "count": n})

    # SLA donut (3 buckets) — aproximación: fecha límite vs ahora
    now_ts = now
    sla_ok = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    *vbase,
                    *_activa_vuln_conds(),
                    Vulnerabilidad.fecha_limite_sla.isnot(None),
                    Vulnerabilidad.fecha_limite_sla > now_ts + timedelta(days=3),
                )
            )
        ).scalar_one()
        or 0
    )
    sla_riesgo = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    *vbase,
                    *_activa_vuln_conds(),
                    Vulnerabilidad.fecha_limite_sla.isnot(None),
                    Vulnerabilidad.fecha_limite_sla <= now_ts + timedelta(days=3),
                    Vulnerabilidad.fecha_limite_sla >= now_ts,
                )
            )
        ).scalar_one()
        or 0
    )
    sla_v = int(
        (
            await db.execute(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(
                    *vbase,
                    *_activa_vuln_conds(),
                    Vulnerabilidad.fecha_limite_sla.isnot(None),
                    Vulnerabilidad.fecha_limite_sla < now_ts,
                )
            )
        ).scalar_one()
        or 0
    )
    sla_tot = max(1, sla_ok + sla_riesgo + sla_v)
    sla_status = [
        {
            "status": "ok",
            "label": "A Tiempo",
            "count": sla_ok,
            "percentage": int(sla_ok * 100 / sla_tot),
        },
        {
            "status": "warning",
            "label": "En Riesgo",
            "count": sla_riesgo,
            "percentage": int(sla_riesgo * 100 / sla_tot),
        },
        {
            "status": "critical",
            "label": "Vencido",
            "count": sla_v,
            "percentage": int(sla_v * 100 / sla_tot),
        },
    ]

    # Auditorías listado
    q_aud = select(Auditoria).where(Auditoria.deleted_at.is_(None))
    if audits_solo_activas:
        q_aud = q_aud.where(
            or_(
                Auditoria.estado.ilike("%activ%"),
                Auditoria.estado.ilike("%curso%"),
            )
        )
    q_aud = q_aud.order_by(Auditoria.fecha_inicio.desc()).offset(audits_offset).limit(max(1, min(audits_limit, 50)))
    ad_rows = (await db.execute(q_aud)).scalars().all()
    tot_aud = int(
        (
            await db.execute(select(func.count()).select_from(Auditoria).where(Auditoria.deleted_at.is_(None)))
        ).scalar_one()
        or 0
    )
    audits_out = [
        {
            "id": str(a.id),
            "nombre": a.titulo,
            "tipo": a.tipo,
            "responsable": "—",
            "fecha": a.fecha_inicio.date().isoformat() if a.fecha_inicio else "—",
            "fecha_inicio": a.fecha_inicio.date().isoformat() if a.fecha_inicio else None,
            "fecha_fin": a.fecha_fin.date().isoformat() if a.fecha_fin else None,
            "estado": a.estado,
            "hallazgos": 0,
            "pendientes": 0,
        }
        for a in ad_rows
    ]

    return {
        "kpis": {
            "programs_advancement": programs_advancement,
            "critical_vulns": crit_active,
            "active_releases": active_releases,
            "emerging_themes": emerging,
            "audits": audits_active,
            "initiatives_active": initiatives_active,
            "initiatives_advancement": initiatives_advancement,
        },
        "kpi_sub": {
            "critical_by_fuente": by_fuente,
            "emerging_stale_7d": 0,
            "releases_sla_riesgo": at_risk_releases,
            "releases_riesgo_pct": int((at_risk_releases * 100 / active_releases) if active_releases else 0),
            "audits_not_completed": max(0, tot_aud - audits_active),
        },
        "kpi_trends": {
            "avance_cierre_pp": 0,
            "volumen_severidad_delta": 0,
        },
        "risk_level": risk,
        "security_posture": posture,
        "trend_months": tm,
        "trend_mode": "sliding" if not ref_month else "calendar",
        "ref_month": ref_month,
        "trend_data": trend_data,
        "sla_spark": None,
        "top_repos": top_repos,
        "sla_status": sla_status,
        "audits": audits_out,
        "audits_total": tot_aud,
        "audits_offset": audits_offset,
        "audits_limit": audits_limit,
        "audits_solo_activas": audits_solo_activas,
        "generated_at": now.isoformat(),
        "applied_filters": _hierarchy_dict(
            direccion_id=direccion_id,
            subdireccion_id=subdireccion_id,
            gerencia_id=gerencia_id,
            organizacion_id=organizacion_id,
            celula_id=celula_id,
            repositorio_id=repositorio_id,
        ),
    }


def _parse_uuid_opt(value: str | None) -> UUID | None:
    if not value:
        return None
    try:
        return UUID(value)
    except ValueError:
        return None


async def generate_executive_dashboard_pdf(
    db: AsyncSession,
    *,
    user_id: UUID,
    filters: dict[str, str | None],
) -> dict:
    """Payload JSON para la UI de exportación PDF del dashboard ejecutivo (metadatos + KPIs)."""
    _ = user_id
    payload = await build_executive_dashboard(
        db,
        direccion_id=_parse_uuid_opt(filters.get("direccion_id")),
        subdireccion_id=_parse_uuid_opt(filters.get("subdireccion_id")),
        gerencia_id=_parse_uuid_opt(filters.get("gerencia_id")),
        organizacion_id=_parse_uuid_opt(filters.get("organizacion_id")),
        celula_id=_parse_uuid_opt(filters.get("celula_id")),
        repositorio_id=None,
        trend_months=6,
        ref_month=None,
        audits_offset=0,
        audits_limit=10,
        audits_solo_activas=True,
    )
    return {
        "kpis": payload["kpis"],
        "applied_filters": payload["applied_filters"],
        "generated_at": payload["generated_at"],
    }


async def get_executive_drilldown(
    db: AsyncSession,
    *,
    user_id: UUID,
    tipo: str,
    filtro: str,
    valor: str,
) -> dict:
    """Listados filtrados alineados con los KPIs del dashboard ejecutivo."""
    _ = user_id
    t = (tipo or "").strip().lower()
    fv = (filtro or "").strip().lower()
    vv = (valor or "").strip()

    scope = vulnerabilidad_en_celulas_o_repo(
        direccion_id=None,
        subdireccion_id=None,
        gerencia_id=None,
        organizacion_id=None,
        celula_id=None,
        repositorio_id=None,
    )
    vbase = [Vulnerabilidad.deleted_at.is_(None)]
    if scope is not None:
        vbase.append(scope)

    if t == "vulnerabilidades":
        q = select(Vulnerabilidad).where(*vbase)
        if fv == "severidad":
            q = q.where(Vulnerabilidad.severidad.ilike(vv))
        elif fv == "estado":
            q = q.where(Vulnerabilidad.estado.ilike(vv))
        elif fv == "fuente":
            q = q.where(Vulnerabilidad.fuente.ilike(vv))
        rows = (await db.execute(q.limit(100))).scalars().all()
        items = [
            {
                "id": str(v.id),
                "severidad": v.severidad,
                "estado": v.estado,
                "fuente": v.fuente,
            }
            for v in rows
        ]
        return {"tipo": "vulnerabilidades", "items": items, "total": len(items), "filtro": fv, "valor": vv}

    if t == "programas":
        items = [{"motor": m, "estado": "activo"} for m in FIVE_MOTORS]
        return {"tipo": "programas", "items": items, "total": len(items), "filtro": fv, "valor": vv}

    if t == "auditorias":
        q = select(Auditoria).where(Auditoria.deleted_at.is_(None))
        if fv == "estado":
            q = q.where(Auditoria.estado.ilike(f"%{vv}%"))
        rows = (await db.execute(q.limit(100))).scalars().all()
        items = [{"id": str(a.id), "nombre": a.titulo, "estado": a.estado, "tipo": a.tipo} for a in rows]
        return {"tipo": "auditorias", "items": items, "total": len(items), "filtro": fv, "valor": vv}

    if t == "temas":
        q = select(TemaEmergente).where(TemaEmergente.deleted_at.is_(None))
        if fv == "estado":
            q = q.where(TemaEmergente.estado.ilike(f"%{vv}%"))
        rows = (await db.execute(q.limit(100))).scalars().all()
        items = [{"id": str(x.id), "titulo": x.titulo, "estado": x.estado} for x in rows]
        return {"tipo": "temas", "items": items, "total": len(items), "filtro": fv, "valor": vv}

    return {"tipo": t or "unknown", "items": [], "total": 0, "filtro": fv, "valor": vv, "error": "unrecognized_tipo"}
