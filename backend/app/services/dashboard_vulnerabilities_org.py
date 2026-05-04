"""Payload para `GET /api/v1/dashboard/vulnerabilities` (Dashboard 4 org, 7 niveles)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.celula import Celula
from app.models.direccion import Direccion
from app.models.gerencia import Gerencia
from app.models.organizacion import Organizacion
from app.models.repositorio import Repositorio
from app.models.subdireccion import Subdireccion
from app.models.vulnerabilidad import Vulnerabilidad
from app.services.vulnerability_scope import VULNERABILITY_MOTOR_CODES, vulnerabilidad_en_celulas_o_repo


def _hfd(
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


async def _n(db: AsyncSession, scope, extra: list | None = None) -> int:
    cond = [Vulnerabilidad.deleted_at.is_(None)]
    if scope is not None:
        cond.append(scope)
    if extra:
        cond.extend(extra)
    return int((await db.execute(select(func.count()).select_from(Vulnerabilidad).where(*cond))).scalar_one() or 0)


async def build_vulnerabilities_org_dashboard(
    db: AsyncSession,
    *,
    direccion_id: UUID | None,
    subdireccion_id: UUID | None,
    gerencia_id: UUID | None,
    organizacion_id: UUID | None,
    celula_id: UUID | None,
    repositorio_id: UUID | None,
    engines: list[str] | None = None,
    severities: list[str] | None = None,
    statuses: list[str] | None = None,
    sla: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> dict:
    scope = vulnerabilidad_en_celulas_o_repo(
        direccion_id=direccion_id,
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
        repositorio_id=repositorio_id,
    )

    extra_filters = []
    if engines:
        extra_filters.append(Vulnerabilidad.fuente.in_(engines))
    if severities:
        extra_filters.append(func.lower(Vulnerabilidad.severidad).in_([s.lower() for s in severities]))
    if statuses:
        extra_filters.append(Vulnerabilidad.estado.in_(statuses))
    
    now = datetime.now(UTC)
    if sla == "vencido":
        extra_filters.append(Vulnerabilidad.fecha_limite_sla < now)
        extra_filters.append(Vulnerabilidad.estado != "Cerrada")
    elif sla == "en_tiempo":
        extra_filters.append(Vulnerabilidad.fecha_limite_sla >= now)
    
    if start_date:
        extra_filters.append(Vulnerabilidad.created_at >= start_date)
    if end_date:
        extra_filters.append(Vulnerabilidad.created_at <= end_date)

    total = await _n(db, scope, extra_filters)
    sev_map = [("CRITICA", "Critica"), ("ALTA", "Alta"), ("MEDIA", "Media"), ("BAJA", "Baja")]
    by_sev = {}
    for api_k, col in sev_map:
        c = await _n(
            db,
            scope,
            [*extra_filters, func.lower(Vulnerabilidad.severidad) == col.lower()],
        )
        by_sev[api_k] = c

    children = []
    vulnerability_rows = []

    # Motores con métricas (Anterior, Solventadas, Nuevas)
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    engine_data = []
    for m in VULNERABILITY_MOTOR_CODES:
        actual = await _n(db, scope, [*extra_filters, Vulnerabilidad.fuente == m, Vulnerabilidad.estado != "Cerrada"])
        anterior = await _n(db, scope, [*extra_filters, Vulnerabilidad.fuente == m, Vulnerabilidad.created_at < this_month_start, Vulnerabilidad.estado != "Cerrada"])
        nuevas = await _n(db, scope, [*extra_filters, Vulnerabilidad.fuente == m, Vulnerabilidad.created_at >= this_month_start])
        solventadas = await _n(db, scope, [*extra_filters, Vulnerabilidad.fuente == m, Vulnerabilidad.estado == "Cerrada", Vulnerabilidad.updated_at >= this_month_start])
        
        diff = actual - anterior
        trend = f"{'+' if diff >= 0 else ''}{diff}"
        engine_data.append({
            "id": m.lower(),
            "nombre": m,
            "anterior": anterior,
            "actual": actual,
            "solventadas": solventadas,
            "nuevas": nuevas,
            "tendencia": trend,
            "diff": diff,
            "up": diff > 0
        })

    # Tendencia (Anual/Mensual)
    trend_data = {"labels": [], "activas": [], "solventadas": [], "nuevas": [], "critAltas": []}
    for i in range(11, -1, -1):
        m_start = (now - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        m_end = (m_start + timedelta(days=32)).replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(seconds=1)
        
        period = m_start.strftime("%b")
        trend_data["labels"].append(period)
        
        act = await _n(db, scope, [*extra_filters, Vulnerabilidad.created_at <= m_end, Vulnerabilidad.estado != "Cerrada"])
        solv = await _n(db, scope, [*extra_filters, Vulnerabilidad.estado == "Cerrada", Vulnerabilidad.updated_at >= m_start, Vulnerabilidad.updated_at <= m_end])
        new = await _n(db, scope, [*extra_filters, Vulnerabilidad.created_at >= m_start, Vulnerabilidad.created_at <= m_end])
        crit = await _n(db, scope, [*extra_filters, Vulnerabilidad.created_at <= m_end, Vulnerabilidad.estado != "Cerrada", func.lower(Vulnerabilidad.severidad).in_(["critica", "alta"])])
        
        trend_data["activas"].append(act)
        trend_data["solventadas"].append(solv)
        trend_data["nuevas"].append(new)
        trend_data["critAltas"].append(crit)

    # Top Vulnerabilidades
    top_q = await db.execute(
        select(Vulnerabilidad.titulo, func.count(Vulnerabilidad.id).label("c"))
        .where(Vulnerabilidad.deleted_at.is_(None), *([scope] if scope is not None else []), *extra_filters)
        .group_by(Vulnerabilidad.titulo)
        .order_by(func.count(Vulnerabilidad.id).desc())
        .limit(5)
    )
    top_vulns = [{"nombre": r[0], "count": r[1]} for r in top_q.all()]

    by_state: dict[str, int] = {}
    for st in ("Abierta", "En Progreso", "Remediada", "Cerrada"):
        by_state[st] = await _n(db, scope, [*extra_filters, Vulnerabilidad.estado == st])

    sla_ok = await _n(
        db,
        scope,
        [
            *extra_filters,
            Vulnerabilidad.fecha_limite_sla.isnot(None),
            Vulnerabilidad.fecha_limite_sla > now,
            Vulnerabilidad.estado != "Cerrada",
        ],
    )
    sla_bad = await _n(
        db,
        scope,
        [
            *extra_filters,
            Vulnerabilidad.fecha_limite_sla.isnot(None),
            Vulnerabilidad.fecha_limite_sla < now,
            Vulnerabilidad.estado != "Cerrada",
        ],
    )
    sla_warn = max(0, total - sla_ok - sla_bad - by_state.get("Cerrada", 0)) if total else 0
    sla_status = {"green": sla_ok, "yellow": sla_warn, "red": sla_bad}
    overdue = sla_bad

    # Lógica para hijos con desgloses de motores y pipeline
    async def _get_child_stats(child_scope):
        sast = await _n(db, child_scope, [*extra_filters, Vulnerabilidad.fuente == "SAST", Vulnerabilidad.estado != "Cerrada"])
        sca = await _n(db, child_scope, [*extra_filters, Vulnerabilidad.fuente == "SCA", Vulnerabilidad.estado != "Cerrada"])
        cds = await _n(db, child_scope, [*extra_filters, Vulnerabilidad.fuente == "CDS", Vulnerabilidad.estado != "Cerrada"])
        dast = await _n(db, child_scope, [*extra_filters, Vulnerabilidad.fuente == "DAST", Vulnerabilidad.estado != "Cerrada"])
        mda = await _n(db, child_scope, [*extra_filters, Vulnerabilidad.fuente == "MDA", Vulnerabilidad.estado != "Cerrada"])
        mast = await _n(db, child_scope, [*extra_filters, Vulnerabilidad.fuente == "MAST", Vulnerabilidad.estado != "Cerrada"])
        
        crit = await _n(db, child_scope, [*extra_filters, func.lower(Vulnerabilidad.severidad) == "critica", Vulnerabilidad.estado != "Cerrada"])
        alta = await _n(db, child_scope, [*extra_filters, func.lower(Vulnerabilidad.severidad) == "alta", Vulnerabilidad.estado != "Cerrada"])
        med = await _n(db, child_scope, [*extra_filters, func.lower(Vulnerabilidad.severidad) == "media", Vulnerabilidad.estado != "Cerrada"])
        t = sast + sca + cds + dast + mda + mast
        
        score = 100
        if t > 0:
            score = max(0, int(100 - ((crit * 10) + (alta * 3) + (med * 1)) / t * 100))
            
        total_scope = await _n(db, child_scope, extra_filters)
        cerradas_scope = await _n(db, child_scope, [*extra_filters, Vulnerabilidad.estado == "Cerrada"])
        pct_cerradas = int(round(100 * cerradas_scope / total_scope)) if total_scope else 0
        return {
            "sast": sast, "sca": sca, "cds": cds, "dast": dast, "mda": mda, "mast": mast,
            "maturity_score": score,
            "aprobados": f"{pct_cerradas}%",
            "rechazados": f"{max(0, 100 - pct_cerradas)}%",
        }

    if repositorio_id is not None:
        children_type = "vulnerabilidad"
        q = await db.execute(
            select(Vulnerabilidad)
            .where(
                Vulnerabilidad.deleted_at.is_(None),
                Vulnerabilidad.repositorio_id == repositorio_id,
                *extra_filters,
            )
            .order_by(Vulnerabilidad.created_at.desc())
            .limit(200)
        )
        for v in q.scalars().all():
            vulnerability_rows.append(
                {
                    "id": str(v.id),
                    "motor": v.fuente,
                    "severidad": v.severidad,
                    "titulo": v.titulo,
                    "descripcion": v.descripcion or "",
                    "fecha_deteccion": v.created_at.isoformat() if v.created_at else None,
                    "sla": v.fecha_limite_sla.isoformat() if v.fecha_limite_sla else None,
                    "estado": v.estado,
                    "cvss": v.cvss_score or "0.0",
                    "code_evidence": v.evidencia or "N/A",
                    "recommendation": v.recomendacion or "Seguir guías de remediación estándar.",
                }
            )
    elif celula_id is not None:
        children_type = "repositorio"
        rq = await db.execute(select(Repositorio).where(Repositorio.celula_id == celula_id, Repositorio.deleted_at.is_(None)))
        for r in rq.scalars().all():
            stats = await _get_child_stats(Vulnerabilidad.repositorio_id == r.id)
            children.append({"id": str(r.id), "name": r.nombre, "count": sum([stats[m.lower()] for m in ["sast","sca","cds","dast","mda","mast"]]), **stats})
    elif organizacion_id is not None:
        children_type = "celula"
        rq = await db.execute(select(Celula).where(Celula.organizacion_id == organizacion_id, Celula.deleted_at.is_(None)))
        for c in rq.scalars().all():
            s = vulnerabilidad_en_celulas_o_repo(direccion_id=None, subdireccion_id=None, gerencia_id=None, organizacion_id=None, celula_id=c.id, repositorio_id=None)
            stats = await _get_child_stats(s)
            children.append({"id": str(c.id), "name": c.nombre, "count": sum([stats[m.lower()] for m in ["sast","sca","cds","dast","mda","mast"]]), **stats})
    elif gerencia_id is not None:
        children_type = "organizacion"
        rq = await db.execute(select(Organizacion).where(Organizacion.gerencia_id == gerencia_id, Organizacion.deleted_at.is_(None)))
        for o in rq.scalars().all():
            s = vulnerabilidad_en_celulas_o_repo(direccion_id=None, subdireccion_id=None, gerencia_id=None, organizacion_id=o.id, celula_id=None, repositorio_id=None)
            stats = await _get_child_stats(s)
            children.append({"id": str(o.id), "name": o.nombre, "count": sum([stats[m.lower()] for m in ["sast","sca","cds","dast","mda","mast"]]), **stats})
    elif subdireccion_id is not None:
        children_type = "gerencia"
        rq = await db.execute(select(Gerencia).where(Gerencia.subdireccion_id == subdireccion_id, Gerencia.deleted_at.is_(None)))
        for g in rq.scalars().all():
            s = vulnerabilidad_en_celulas_o_repo(direccion_id=None, subdireccion_id=None, gerencia_id=g.id, organizacion_id=None, celula_id=None, repositorio_id=None)
            stats = await _get_child_stats(s)
            children.append({"id": str(g.id), "name": g.nombre, "count": sum([stats[m.lower()] for m in ["sast","sca","cds","dast","mda","mast"]]), **stats})
    elif direccion_id is not None:
        children_type = "subdireccion"
        rq = await db.execute(select(Subdireccion).where(Subdireccion.direccion_id == direccion_id, Subdireccion.deleted_at.is_(None)))
        for sd in rq.scalars().all():
            s = vulnerabilidad_en_celulas_o_repo(direccion_id=None, subdireccion_id=sd.id, gerencia_id=None, organizacion_id=None, celula_id=None, repositorio_id=None)
            stats = await _get_child_stats(s)
            children.append({"id": str(sd.id), "name": sd.nombre, "count": sum([stats[m.lower()] for m in ["sast","sca","cds","dast","mda","mast"]]), **stats})
    else:
        children_type = "direccion"
        rq = await db.execute(select(Direccion).where(Direccion.deleted_at.is_(None)))
        for di in rq.scalars().all():
            s = vulnerabilidad_en_celulas_o_repo(direccion_id=di.id, subdireccion_id=None, gerencia_id=None, organizacion_id=None, celula_id=None, repositorio_id=None)
            stats = await _get_child_stats(s)
            children.append({"id": str(di.id), "name": di.nombre, "count": sum([stats[m.lower()] for m in ["sast","sca","cds","dast","mda","mast"]]), **stats})

    # Semáforo
    sem_status = "bajo"
    if total > 5000: sem_status = "alto"
    elif total > 1000: sem_status = "medio"
    
    summary = {
        "total": total,
        "by_engine": [{"motor": m["nombre"], "count": m["actual"], "trend": m["diff"]} for m in engine_data],
        "by_severity": by_sev,
        "trend": [{"period": trend_data["labels"][i], "count": trend_data["activas"][i]} for i in range(len(trend_data["labels"]))],
        "pipeline": by_state
    }

    cerradas_tot = by_state.get("Cerrada", 0)
    pct_pipeline = int(round(100 * cerradas_tot / total)) if total else 0
    tendencia_str = "0%"
    if len(trend_data["activas"]) >= 2:
        cur_a = trend_data["activas"][-1]
        prev_a = trend_data["activas"][-2]
        if prev_a > 0:
            delta_pct = int(round(100 * (cur_a - prev_a) / prev_a))
            tendencia_str = f"{'+' if delta_pct >= 0 else ''}{delta_pct}%"
        elif cur_a > 0:
            tendencia_str = "+100%"

    return {
        "summary": summary,
        "semaforo": {
            "estado": sem_status,
            "total": total,
            "tendencia": tendencia_str,
        },
        "motores": engine_data,
        "tendencia": trend_data,
        "top_vulns": top_vulns,
        "pipeline": {
            "total": total,
            "aprobados": cerradas_tot,
            "rechazados": max(0, total - cerradas_tot),
            "pct": pct_pipeline,
        },
        "children": children,
        "children_type": children_type,
        "vulnerabilities": vulnerability_rows,
        "total_vulnerabilities": total,
        "by_severity": by_sev,
        "by_state": by_state,
        "sla_status": sla_status,
        "overdue_count": overdue,
        "applied_filters": _hfd(
            direccion_id=direccion_id,
            subdireccion_id=subdireccion_id,
            gerencia_id=gerencia_id,
            organizacion_id=organizacion_id,
            celula_id=celula_id,
            repositorio_id=repositorio_id,
        ),
    }
