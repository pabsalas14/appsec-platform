"""P10 — avance de iniciativa a partir de hitos (actividades) del mes o del backlog."""

from __future__ import annotations

import uuid
from calendar import monthrange
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hito_iniciativa import HitoIniciativa
from app.models.iniciativa import Iniciativa


def _estado_a_factor(estado: str) -> float:
    s = (estado or "").strip().lower()
    if s in ("completado", "cerrado", "hecho", "listo", "remediado", "finalizado", "100%"):
        return 1.0
    if s in ("en proceso", "en progreso", "en curso", "en revisión", "en revision", "pendiente de firma"):
        return 0.5
    return 0.0


@dataclass
class ProgresoMesPayload:
    anio: int
    mes: int
    progreso_total_pct: float
    actividades: list[dict]


async def progreso_iniciativa_mes(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    iniciativa_id: uuid.UUID,
    anio: int | None = None,
    mes: int | None = None,
) -> ProgresoMesPayload | None:
    ini = await db.get(Iniciativa, iniciativa_id)
    if ini is None or ini.deleted_at is not None or ini.user_id != user_id:
        return None
    now = datetime.now(UTC)
    y = anio or now.year
    m = mes or now.month
    m_start = datetime(y, m, 1, 0, 0, 0, tzinfo=UTC)
    m_end = datetime(y, m, monthrange(y, m)[1], 23, 59, 59, tzinfo=UTC)

    q = select(HitoIniciativa).where(
        and_(
            HitoIniciativa.user_id == user_id,
            HitoIniciativa.iniciativa_id == iniciativa_id,
            HitoIniciativa.deleted_at.is_(None),
        )
    )
    hitos = list((await db.execute(q)).scalars().all())
    in_month: list[HitoIniciativa] = []
    for h in hitos:
        if h.fecha_estimada is None:
            in_month.append(h)
        else:
            fe = h.fecha_estimada
            if fe.tzinfo is None:
                fe = fe.replace(tzinfo=UTC)
            if m_start <= fe <= m_end:
                in_month.append(h)
    use = in_month or hitos
    n = len(use)
    if n == 0:
        return ProgresoMesPayload(anio=y, mes=m, progreso_total_pct=0.0, actividades=[])

    all_have_peso = all(getattr(h, "peso", None) is not None and h.peso > 0 for h in use)
    if all_have_peso:
        raw_weights = [float(h.peso) for h in use]
        sw = sum(raw_weights)
        weights = [100.0 * w / sw for w in raw_weights] if sw > 0 else [100.0 / n] * n
    else:
        weights = [100.0 / n] * n

    total_w = sum(weights)
    weighted = 0.0
    rows: list[dict] = []
    for h, w in zip(use, weights, strict=True):
        fac = _estado_a_factor(h.estado)
        weighted += w * fac
        rows.append(
            {
                "id": str(h.id),
                "titulo": h.titulo,
                "peso_pct": round(w, 2),
                "peso_configurado": getattr(h, "peso", None),
                "estado": h.estado,
                "aporte_simulado_pct": round(w * fac, 2),
            }
        )
    pct = (weighted / total_w * 100.0) if total_w else 0.0
    return ProgresoMesPayload(anio=y, mes=m, progreso_total_pct=round(pct, 2), actividades=rows)
