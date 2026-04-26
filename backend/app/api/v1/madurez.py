"""Score de madurez (E2) — agregado auditable a partir de vulnerabilidades y config."""

from __future__ import annotations

import csv
from io import StringIO
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.response import success
from app.models.celula import Celula
from app.models.gerencia import Gerencia
from app.models.organizacion import Organizacion
from app.models.repositorio import Repositorio
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad
from app.services.json_setting import get_json_setting
from app.services.vulnerabilidad_flujo import (
    estados_activa_clasificacion,
    estados_cerrada_clasificacion,
    parse_estatus_catalog,
)

router = APIRouter()


async def _compute_madurez_payload(
    db: AsyncSession,
    current_user: User,
    *,
    subdireccion_id: UUID | None = None,
    gerencia_id: UUID | None = None,
    organizacion_id: UUID | None = None,
    celula_id: UUID | None = None,
) -> dict:
    raw = await get_json_setting(db, "catalogo.estatus_vulnerabilidad", [])
    estatus = parse_estatus_catalog(raw)
    cerrados = estados_cerrada_clasificacion(estatus)
    activa = estados_activa_clasificacion(estatus)

    base = [Vulnerabilidad.user_id == current_user.id, Vulnerabilidad.deleted_at.is_(None)]

    if celula_id:
        base.append(
            Vulnerabilidad.repositorio_id.isnot(None)
            & (
                Vulnerabilidad.repositorio_id.in_(
                    select(Repositorio.id).where(
                        Repositorio.celula_id == celula_id,
                        Repositorio.deleted_at.is_(None),
                    )
                )
            )
        )
    elif organizacion_id:
        base.append(
            Vulnerabilidad.repositorio_id.isnot(None)
            & (
                Vulnerabilidad.repositorio_id.in_(
                    select(Repositorio.id)
                    .join(Celula, Celula.id == Repositorio.celula_id)
                    .where(
                        Celula.organizacion_id == organizacion_id,
                        Repositorio.deleted_at.is_(None),
                        Celula.deleted_at.is_(None),
                    )
                )
            )
        )
    elif gerencia_id:
        base.append(
            Vulnerabilidad.repositorio_id.isnot(None)
            & (
                Vulnerabilidad.repositorio_id.in_(
                    select(Repositorio.id)
                    .join(Celula, Celula.id == Repositorio.celula_id)
                    .join(Organizacion, Organizacion.id == Celula.organizacion_id)
                    .where(
                        Organizacion.gerencia_id == gerencia_id,
                        Repositorio.deleted_at.is_(None),
                        Celula.deleted_at.is_(None),
                        Organizacion.deleted_at.is_(None),
                    )
                )
            )
        )
    elif subdireccion_id:
        base.append(
            Vulnerabilidad.repositorio_id.isnot(None)
            & (
                Vulnerabilidad.repositorio_id.in_(
                    select(Repositorio.id)
                    .join(Celula, Celula.id == Repositorio.celula_id)
                    .join(Organizacion, Organizacion.id == Celula.organizacion_id)
                    .join(Gerencia, Gerencia.id == Organizacion.gerencia_id)
                    .where(
                        Gerencia.subdireccion_id == subdireccion_id,
                        Repositorio.deleted_at.is_(None),
                        Celula.deleted_at.is_(None),
                        Organizacion.deleted_at.is_(None),
                        Gerencia.deleted_at.is_(None),
                    )
                )
            )
        )

    q_total = select(func.count()).select_from(Vulnerabilidad).where(*base, Vulnerabilidad.estado != "")
    n_total = (await db.execute(q_total)).scalar_one()

    c_closed = 0.0
    if cerrados:
        q_c = (
            select(func.count())
            .select_from(Vulnerabilidad)
            .where(
                *base,
                Vulnerabilidad.estado.in_(list(cerrados)),
            )
        )
        c_closed = float((await db.execute(q_c)).scalar_one())
    c_active = 0.0
    if activa:
        q_a = (
            select(func.count())
            .select_from(Vulnerabilidad)
            .where(
                *base,
                Vulnerabilidad.estado.in_(list(activa)),
            )
        )
        c_active = float((await db.execute(q_a)).scalar_one())

    pesos = await get_json_setting(
        db,
        "madurez.pesos",
        {"cierre": 0.6, "backlog_sano": 0.4},
    )
    w_cierre = float(pesos.get("cierre", 0.6))
    w_back = float(pesos.get("backlog_sano", 0.4))

    ratio_cierre = (c_closed / n_total) if n_total else 0.0
    ratio_activa = (c_active / n_total) if n_total else 0.0
    backlog_sano = 1.0 - ratio_activa if n_total else 0.0

    score = round(100.0 * (w_cierre * ratio_cierre + w_back * backlog_sano), 2)

    return {
        "scope": {
            "subdireccion_id": str(subdireccion_id) if subdireccion_id else None,
            "gerencia_id": str(gerencia_id) if gerencia_id else None,
            "organizacion_id": str(organizacion_id) if organizacion_id else None,
            "celula_id": str(celula_id) if celula_id else None,
        },
        "counts": {
            "vulnerabilidades_total": n_total,
            "cerradas": int(c_closed),
            "activas_catalogo": int(c_active),
        },
        "score": score,
        "max": 100.0,
        "weights_applied": {"cierre": w_cierre, "backlog_sano": w_back},
    }


@router.get("/summary")
async def get_madurez_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    subdireccion_id: UUID | None = Query(None),
    gerencia_id: UUID | None = Query(None),
    organizacion_id: UUID | None = Query(None),
    celula_id: UUID | None = Query(None),
):
    """
    Score 0-100 de madurez: proporción de vulnerabilidades en estados "cerrada/remediada" vs totales
    bajo el mismo alcance jerárquico que los dashboards, con pesos en `system_settings` `madurez.pesos`.
    """
    payload = await _compute_madurez_payload(
        db,
        current_user,
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    return success(payload)


@router.get("/export.csv")
async def export_madurez_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    subdireccion_id: UUID | None = Query(None),
    gerencia_id: UUID | None = Query(None),
    organizacion_id: UUID | None = Query(None),
    celula_id: UUID | None = Query(None),
):
    """E2: exporta una fila con score y conteos bajo el mismo alcance que `/summary`."""
    payload = await _compute_madurez_payload(
        db,
        current_user,
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
    )
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "score",
            "vulnerabilidades_total",
            "cerradas",
            "activas_catalogo",
            "subdireccion_id",
            "gerencia_id",
            "organizacion_id",
            "celula_id",
        ]
    )
    sc = payload["scope"]
    cts = payload["counts"]
    w.writerow(
        [
            str(payload["score"]),
            cts["vulnerabilidades_total"],
            cts["cerradas"],
            cts["activas_catalogo"],
            sc.get("subdireccion_id") or "",
            sc.get("gerencia_id") or "",
            sc.get("organizacion_id") or "",
            sc.get("celula_id") or "",
        ]
    )
    return Response(
        content=buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="madurez_score.csv"'},
    )
