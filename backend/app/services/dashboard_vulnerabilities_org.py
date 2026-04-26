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
from app.services.vulnerability_scope import FIVE_MOTORS, vulnerabilidad_en_celulas_o_repo


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


async def _n(
    db: AsyncSession, scope, extra: list | None = None
) -> int:
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
) -> dict:
    scope = vulnerabilidad_en_celulas_o_repo(
        direccion_id=direccion_id,
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
        repositorio_id=repositorio_id,
    )

    total = await _n(db, scope)
    sev_map = [("CRITICA", "Critica"), ("ALTA", "Alta"), ("MEDIA", "Media"), ("BAJA", "Baja")]
    by_sev = {}
    for api_k, col in sev_map:
        c = await _n(
            db,
            scope,
            [func.lower(Vulnerabilidad.severidad) == col.lower()],
        )
        by_sev[api_k] = c

    engine_data = []
    for m in list(FIVE_MOTORS) + ["MAST"]:
        c = await _n(db, scope, [Vulnerabilidad.fuente == m])
        engine_data.append({"motor": m, "count": c, "trend": 0})

    now = datetime.now(UTC)
    trend_data = []
    for month_offset in range(5, -1, -1):
        month_start = (now - timedelta(days=30 * (month_offset + 1))).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0, tzinfo=UTC
        )
        month_end = (now - timedelta(days=30 * month_offset)).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0, tzinfo=UTC
        ) - timedelta(seconds=1)
        period = month_start.strftime("%b %Y")
        cnt = await _n(
            db,
            scope,
            [Vulnerabilidad.created_at >= month_start, Vulnerabilidad.created_at <= month_end],
        )
        trend_data.append({"period": period, "count": cnt})

    by_state: dict[str, int] = {}
    for st in ("Abierta", "En Progreso", "Remediada", "Cerrada"):
        by_state[st] = await _n(db, scope, [Vulnerabilidad.estado == st])

    now_ts = now
    sla_ok = await _n(
        db,
        scope,
        [
            Vulnerabilidad.fecha_limite_sla.isnot(None),
            Vulnerabilidad.fecha_limite_sla > now_ts,
            Vulnerabilidad.estado != "Cerrada",
        ],
    )
    sla_bad = await _n(
        db,
        scope,
        [
            Vulnerabilidad.fecha_limite_sla.isnot(None),
            Vulnerabilidad.fecha_limite_sla < now_ts,
            Vulnerabilidad.estado != "Cerrada",
        ],
    )
    sla_warn = max(0, total - sla_ok - sla_bad - by_state.get("Cerrada", 0)) if total else 0
    sla_status = {"green": sla_ok, "yellow": sla_warn, "red": sla_bad}
    overdue = sla_bad

    children: list[dict] = []
    children_type: str | None = None
    vulnerability_rows: list[dict] = []

    if repositorio_id is not None:
        children_type = "vulnerabilidad"
        q = await db.execute(
            select(Vulnerabilidad)
            .where(
                Vulnerabilidad.deleted_at.is_(None),
                Vulnerabilidad.repositorio_id == repositorio_id,
                Vulnerabilidad.estado != "Cerrada",
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
                    "descripcion": (v.descripcion or "")[:500],
                    "fecha_deteccion": v.created_at.isoformat() if v.created_at else None,
                    "sla": v.fecha_limite_sla.isoformat() if v.fecha_limite_sla else None,
                    "estado": v.estado,
                }
            )
    elif celula_id is not None and repositorio_id is None:
        children_type = "repositorio"
        rq = await db.execute(
            select(Repositorio.id, Repositorio.nombre, func.count(Vulnerabilidad.id).label("c"))
            .outerjoin(
                Vulnerabilidad,
                (Vulnerabilidad.repositorio_id == Repositorio.id) & (Vulnerabilidad.deleted_at.is_(None)),
            )
            .where(Repositorio.celula_id == celula_id, Repositorio.deleted_at.is_(None))
            .group_by(Repositorio.id, Repositorio.nombre)
        )
        for rid, name, c in rq.all():
            children.append(
                {
                    "id": str(rid),
                    "name": name,
                    "count": int(c or 0),
                    "maturity_score": 0,
                }
            )
    elif organizacion_id is not None and celula_id is None:
        children_type = "celula"
        rq = await db.execute(select(Celula).where(Celula.organizacion_id == organizacion_id, Celula.deleted_at.is_(None)))
        for cel in rq.scalars().all():
            s = vulnerabilidad_en_celulas_o_repo(
                direccion_id=direccion_id,
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=organizacion_id,
                celula_id=cel.id,
                repositorio_id=None,
            )
            n = await _n(db, s)
            children.append({"id": str(cel.id), "name": cel.nombre, "count": n, "maturity_score": 0})
    elif gerencia_id is not None and organizacion_id is None:
        children_type = "organizacion"
        rq = await db.execute(
            select(Organizacion).where(Organizacion.gerencia_id == gerencia_id, Organizacion.deleted_at.is_(None))
        )
        for o in rq.scalars().all():
            s = vulnerabilidad_en_celulas_o_repo(
                direccion_id=direccion_id,
                subdireccion_id=subdireccion_id,
                gerencia_id=gerencia_id,
                organizacion_id=o.id,
                celula_id=None,
                repositorio_id=None,
            )
            n = await _n(db, s)
            children.append({"id": str(o.id), "name": o.nombre, "count": n, "maturity_score": 0})
    elif subdireccion_id is not None and gerencia_id is None:
        children_type = "gerencia"
        rq = await db.execute(
            select(Gerencia).where(Gerencia.subdireccion_id == subdireccion_id, Gerencia.deleted_at.is_(None))
        )
        for g in rq.scalars().all():
            s = vulnerabilidad_en_celulas_o_repo(
                direccion_id=direccion_id,
                subdireccion_id=subdireccion_id,
                gerencia_id=g.id,
                organizacion_id=None,
                celula_id=None,
                repositorio_id=None,
            )
            n = await _n(db, s)
            children.append({"id": str(g.id), "name": g.nombre, "count": n, "maturity_score": 0})
    elif direccion_id is not None and subdireccion_id is None:
        children_type = "subdireccion"
        rq = await db.execute(
            select(Subdireccion).where(Subdireccion.direccion_id == direccion_id, Subdireccion.deleted_at.is_(None))
        )
        for sd in rq.scalars().all():
            s = vulnerabilidad_en_celulas_o_repo(
                direccion_id=direccion_id,
                subdireccion_id=sd.id,
                gerencia_id=None,
                organizacion_id=None,
                celula_id=None,
                repositorio_id=None,
            )
            n = await _n(db, s)
            children.append({"id": str(sd.id), "name": sd.nombre, "count": n, "maturity_score": 0})
    else:
        children_type = "direccion"
        rq = await db.execute(select(Direccion).where(Direccion.deleted_at.is_(None)))
        for di in rq.scalars().all():
            s = vulnerabilidad_en_celulas_o_repo(
                direccion_id=di.id,
                subdireccion_id=None,
                gerencia_id=None,
                organizacion_id=None,
                celula_id=None,
                repositorio_id=None,
            )
            n = await _n(db, s)
            children.append({"id": str(di.id), "name": di.nombre, "count": n, "maturity_score": 0})

    return {
        "summary": {
            "total": total,
            "by_engine": engine_data,
            "by_severity": by_sev,
            "trend": trend_data,
            "pipeline": {**by_state},
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
