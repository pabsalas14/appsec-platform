"""Motor de scoring mensual — 4 pilares + cascada jerárquica (spec 12, Bloque 8)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.actividad_mensual_sast import ActividadMensualSast
from app.models.celula import Celula
from app.models.gerencia import Gerencia
from app.models.historico_scoring_mensual import HistoricoScoringMensual
from app.models.hito_iniciativa import HitoIniciativa
from app.models.iniciativa import Iniciativa
from app.models.okr_revision_q import OkrRevisionQ
from app.models.organizacion import Organizacion
from app.models.programa_sast import ProgramaSast
from app.models.repositorio import Repositorio
from app.models.subdireccion import Subdireccion
from app.models.vulnerabilidad import Vulnerabilidad
from app.services.json_setting import get_json_setting
from app.services.vulnerabilidad_flujo import (
    estados_cerrada_clasificacion,
    parse_estatus_catalog,
)


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


async def _pesos_default(db: AsyncSession) -> dict[str, float]:
    raw = await get_json_setting(
        db,
        "scoring.pesos_componente",
        {"vulnerabilidades": 40.0, "programas": 30.0, "iniciativas": 15.0, "okrs": 15.0},
    )
    if not isinstance(raw, dict):
        raw = {"vulnerabilidades": 40.0, "programas": 30.0, "iniciativas": 15.0, "okrs": 15.0}
    out = {
        "vulnerabilidades": float(raw.get("vulnerabilidades", 40)),
        "programas": float(raw.get("programas", 30)),
        "iniciativas": float(raw.get("iniciativas", 15)),
        "okrs": float(raw.get("okrs", 15)),
    }
    s = sum(out.values()) or 1.0
    return {k: float(v) / s for k, v in out.items()}  # fracciones que suman 1


async def pillar_vulnerabilidades(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    celula_id: uuid.UUID,
) -> float:
    raw = await get_json_setting(db, "catalogo.estatus_vulnerabilidad", [])
    estatus = parse_estatus_catalog(raw)
    cerrados = estados_cerrada_clasificacion(estatus)

    repo_ids = select(Repositorio.id).where(
        Repositorio.celula_id == celula_id,
        Repositorio.user_id == user_id,
        Repositorio.deleted_at.is_(None),
    )

    total_stmt = (
        select(func.count())
        .select_from(Vulnerabilidad)
        .where(
            Vulnerabilidad.user_id == user_id,
            Vulnerabilidad.deleted_at.is_(None),
            Vulnerabilidad.repositorio_id.in_(repo_ids),
        )
    )
    closed_stmt = (
        select(func.count())
        .select_from(Vulnerabilidad)
        .where(
            Vulnerabilidad.user_id == user_id,
            Vulnerabilidad.deleted_at.is_(None),
            Vulnerabilidad.repositorio_id.in_(repo_ids),
            Vulnerabilidad.estado.in_(cerrados if cerrados else {"Remediada", "remediada"}),
        )
    )

    total = int((await db.execute(total_stmt)).scalar_one() or 0)
    closed = int((await db.execute(closed_stmt)).scalar_one() or 0)
    if total == 0:
        return 85.0  # sin hallazgos: score alto por defecto
    return _clamp(100.0 * closed / total)


async def pillar_programas(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    celula_id: uuid.UUID,
    anio: int,
    mes: int,
) -> float:
    """Promedio de score de actividades mensuales SAST del mes para repos de la célula."""
    stmt = (
        select(func.avg(ActividadMensualSast.score))
        .select_from(ActividadMensualSast)
        .join(ProgramaSast, ProgramaSast.id == ActividadMensualSast.programa_sast_id)
        .join(Repositorio, Repositorio.id == ProgramaSast.repositorio_id)
        .where(
            ActividadMensualSast.user_id == user_id,
            ActividadMensualSast.deleted_at.is_(None),
            ProgramaSast.deleted_at.is_(None),
            Repositorio.deleted_at.is_(None),
            Repositorio.celula_id == celula_id,
            ActividadMensualSast.mes == mes,
            ActividadMensualSast.ano == anio,
            ActividadMensualSast.score.isnot(None),
        )
    )
    avg = (await db.execute(stmt)).scalar_one()
    if avg is None:
        return 70.0
    return _clamp(float(avg))


async def pillar_iniciativas(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    celula_id: uuid.UUID,
) -> float:
    stmt = (
        select(func.avg(HitoIniciativa.porcentaje_completado))
        .select_from(HitoIniciativa)
        .join(Iniciativa, Iniciativa.id == HitoIniciativa.iniciativa_id)
        .where(
            HitoIniciativa.user_id == user_id,
            HitoIniciativa.deleted_at.is_(None),
            Iniciativa.deleted_at.is_(None),
            Iniciativa.celula_id == celula_id,
            HitoIniciativa.porcentaje_completado.isnot(None),
        )
    )
    avg = (await db.execute(stmt)).scalar_one()
    if avg is None:
        return 70.0
    return _clamp(float(avg))


async def pillar_okrs(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    anio: int,
    mes: int,
) -> float:
    """Promedio de avance OKR del tenant en el mes (revisión Q)."""
    # Filtrar revisiones cuya updated_at cae en el mes (MVP).
    start = datetime(anio, mes, 1, tzinfo=UTC)
    if mes == 12:
        end = datetime(anio + 1, 1, 1, tzinfo=UTC)
    else:
        end = datetime(anio, mes + 1, 1, tzinfo=UTC)

    stmt = select(
        func.avg(func.coalesce(OkrRevisionQ.avance_validado, OkrRevisionQ.avance_reportado))
    ).where(
        OkrRevisionQ.user_id == user_id,
        OkrRevisionQ.deleted_at.is_(None),
        OkrRevisionQ.updated_at >= start,
        OkrRevisionQ.updated_at < end,
    )
    avg = (await db.execute(stmt)).scalar_one()
    if avg is None:
        return 70.0
    return _clamp(float(avg))


def _total_from_pillars(
    sv: float,
    sp: float,
    si: float,
    so: float,
    pesos: dict[str, float],
) -> float:
    """pesos: fracciones que suman 1."""
    return (
        sv * pesos["vulnerabilidades"]
        + sp * pesos["programas"]
        + si * pesos["iniciativas"]
        + so * pesos["okrs"]
    )


async def run_monthly_scoring(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    anio: int,
    mes: int,
) -> dict[str, Any]:
    """Calcula y persiste snapshots por célula y rollup jerárquico + global."""
    pesos = await _pesos_default(db)

    # Eliminar snapshots previos del periodo para este usuario
    await db.execute(
        delete(HistoricoScoringMensual).where(
            HistoricoScoringMensual.user_id == user_id,
            HistoricoScoringMensual.anio == anio,
            HistoricoScoringMensual.mes == mes,
        )
    )
    await db.flush()

    cel_stmt = select(Celula.id).where(Celula.user_id == user_id, Celula.deleted_at.is_(None))
    celulas = list((await db.execute(cel_stmt)).scalars().all())

    cel_scores: dict[uuid.UUID, dict[str, float]] = {}

    for cid in celulas:
        sv = await pillar_vulnerabilidades(db, user_id=user_id, celula_id=cid)
        sp = await pillar_programas(db, user_id=user_id, celula_id=cid, anio=anio, mes=mes)
        si = await pillar_iniciativas(db, user_id=user_id, celula_id=cid)
        so = await pillar_okrs(db, user_id=user_id, anio=anio, mes=mes)
        total = _total_from_pillars(sv, sp, si, so, pesos)
        cel_scores[cid] = {"total": total, "sv": sv, "sp": sp, "si": si, "so": so}
        db.add(
            HistoricoScoringMensual(
                user_id=user_id,
                anio=anio,
                mes=mes,
                scope_kind="celula",
                scope_id=cid,
                score_total=total,
                score_vulnerabilidades=sv,
                score_programas=sp,
                score_iniciativas=si,
                score_okrs=so,
                pesos_json=pesos,
                detalle_json={"nivel": "celula"},
            )
        )

    # Map celula -> organizacion -> gerencia -> subdireccion -> direccion
    org_map: dict[uuid.UUID, uuid.UUID] = {}
    for cid in celulas:
        r = (
            await db.execute(select(Celula.organizacion_id).where(Celula.id == cid, Celula.deleted_at.is_(None)))
        ).scalar_one_or_none()
        if r:
            org_map[cid] = r

    def avg_for(ids: list[uuid.UUID]) -> dict[str, float]:
        if not ids:
            return {"total": 0.0, "sv": 0.0, "sp": 0.0, "si": 0.0, "so": 0.0}
        acc_t = acc_sv = acc_sp = acc_si = acc_so = 0.0
        n = 0
        for i in ids:
            row = cel_scores.get(i)
            if not row:
                continue
            acc_t += row["total"]
            acc_sv += row["sv"]
            acc_sp += row["sp"]
            acc_si += row["si"]
            acc_so += row["so"]
            n += 1
        if n == 0:
            return {"total": 0.0, "sv": 0.0, "sp": 0.0, "si": 0.0, "so": 0.0}
        return {
            "total": acc_t / n,
            "sv": acc_sv / n,
            "sp": acc_sp / n,
            "si": acc_si / n,
            "so": acc_so / n,
        }

    # Rollup por organizacion
    org_to_cels: dict[uuid.UUID, list[uuid.UUID]] = {}
    for cid, oid in org_map.items():
        org_to_cels.setdefault(oid, []).append(cid)

    ger_map: dict[uuid.UUID, uuid.UUID] = {}
    for oid in org_to_cels:
        gid = (
            await db.execute(select(Organizacion.gerencia_id).where(Organizacion.id == oid, Organizacion.deleted_at.is_(None)))
        ).scalar_one_or_none()
        if gid:
            ger_map[oid] = gid

    sub_map: dict[uuid.UUID, uuid.UUID] = {}
    for gid in set(ger_map.values()):
        sid = (await db.execute(select(Gerencia.subdireccion_id).where(Gerencia.id == gid, Gerencia.deleted_at.is_(None)))).scalar_one_or_none()
        if sid:
            sub_map[gid] = sid

    dir_map: dict[uuid.UUID, uuid.UUID] = {}
    for sid in set(sub_map.values()):
        did = (
            await db.execute(select(Subdireccion.direccion_id).where(Subdireccion.id == sid, Subdireccion.deleted_at.is_(None)))
        ).scalar_one_or_none()
        if did:
            dir_map[sid] = did

    async def persist_aggregate(kind: str, eid: uuid.UUID, vals: dict[str, float]) -> None:
        db.add(
            HistoricoScoringMensual(
                user_id=user_id,
                anio=anio,
                mes=mes,
                scope_kind=kind,
                scope_id=eid,
                score_total=vals["total"],
                score_vulnerabilidades=vals["sv"],
                score_programas=vals["sp"],
                score_iniciativas=vals["si"],
                score_okrs=vals["so"],
                pesos_json=pesos,
                detalle_json={"rollup": kind},
            )
        )

    for oid, cids in org_to_cels.items():
        await persist_aggregate("organizacion", oid, avg_for(cids))

    ger_to_cels: dict[uuid.UUID, list[uuid.UUID]] = {}
    for cid, oid in org_map.items():
        gid = ger_map.get(oid)
        if gid:
            ger_to_cels.setdefault(gid, []).append(cid)

    for gid, cids in ger_to_cels.items():
        await persist_aggregate("gerencia", gid, avg_for(cids))

    sub_to_cels: dict[uuid.UUID, list[uuid.UUID]] = {}
    for cid, oid in org_map.items():
        gid = ger_map.get(oid)
        sid = sub_map.get(gid) if gid else None
        if sid:
            sub_to_cels.setdefault(sid, []).append(cid)

    for sid, cids in sub_to_cels.items():
        await persist_aggregate("subdireccion", sid, avg_for(cids))

    dir_to_cels: dict[uuid.UUID, list[uuid.UUID]] = {}
    for cid, oid in org_map.items():
        gid = ger_map.get(oid)
        sid = sub_map.get(gid) if gid else None
        did = dir_map.get(sid) if sid else None
        if did:
            dir_to_cels.setdefault(did, []).append(cid)

    for did, cids in dir_to_cels.items():
        await persist_aggregate("direccion", did, avg_for(cids))

    # Global (scope_id = user_id como marcador de tenant)
    all_vals = avg_for(list(celulas))
    await persist_aggregate("global", user_id, all_vals)

    await db.flush()

    return {
        "anio": anio,
        "mes": mes,
        "celulas_computadas": len(celulas),
        "pesos": pesos,
        "global": all_vals,
    }
