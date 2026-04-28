"""Payload `GET /dashboard/team/premium` (Dashboard 2 V2) — carga y desglose por analista."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tema_emergente import TemaEmergente
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad
from app.services.vulnerability_scope import vulnerabilidad_en_celulas_o_repo


def _hfd(
    *,
    direccion_id: UUID | None,
    subdireccion_id: UUID | None,
    gerencia_id: UUID | None,
    organizacion_id: UUID | None,
    celula_id: UUID | None,
) -> dict[str, str]:
    o: dict[str, str] = {}
    if direccion_id:
        o["direccion_id"] = str(direccion_id)
    if subdireccion_id:
        o["subdireccion_id"] = str(subdireccion_id)
    if gerencia_id:
        o["gerencia_id"] = str(gerencia_id)
    if organizacion_id:
        o["organizacion_id"] = str(organizacion_id)
    if celula_id:
        o["celula_id"] = str(celula_id)
    return o


def _iniciales(nombre: str) -> str:
    p = (nombre or "??").split()
    if len(p) >= 2:
        return (p[0][0] + p[1][0]).upper()[:2]
    return (nombre or "??")[:2].upper()


async def build_team_premium(
    db: AsyncSession,
    *,
    analista_id: UUID | None,
    subdireccion_id: UUID | None,
    gerencia_id: UUID | None,
    organizacion_id: UUID | None,
    celula_id: UUID | None,
) -> dict:
    scope = vulnerabilidad_en_celulas_o_repo(
        direccion_id=None,
        subdireccion_id=subdireccion_id,
        gerencia_id=gerencia_id,
        organizacion_id=organizacion_id,
        celula_id=celula_id,
        repositorio_id=None,
    )
    vcond = [Vulnerabilidad.deleted_at.is_(None)]
    if scope is not None:
        vcond.append(scope)

    user_rows = (await db.execute(select(User).where(User.is_active.is_(True)))).scalars().all()
    if analista_id is not None:
        user_rows = [u for u in user_rows if u.id == analista_id]

    now = datetime.now(UTC)
    analistas: list[dict] = []
    venc_sum = 0
    for u in user_rows:
        tot = int(
            (
                await db.execute(
                    select(func.count()).select_from(Vulnerabilidad).where(*vcond, Vulnerabilidad.user_id == u.id)
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
                        *vcond,
                        Vulnerabilidad.user_id == u.id,
                        Vulnerabilidad.estado == "Cerrada",
                    )
                )
            ).scalar_one()
            or 0
        )
        open_n = max(0, tot - closed)
        avance = int((closed / tot * 100) if tot else 0)
        venc = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(Vulnerabilidad)
                    .where(
                        *vcond,
                        Vulnerabilidad.user_id == u.id,
                        Vulnerabilidad.fecha_limite_sla.isnot(None),
                        Vulnerabilidad.fecha_limite_sla < now,
                        Vulnerabilidad.estado != "Cerrada",
                    )
                )
            ).scalar_one()
            or 0
        )
        venc_sum += venc
        temas = int(
            (
                await db.execute(
                    select(func.count())
                    .select_from(TemaEmergente)
                    .where(
                        TemaEmergente.deleted_at.is_(None),
                        TemaEmergente.user_id == u.id,
                    )
                )
            ).scalar_one()
            or 0
        )
        riesgo = "vencidas" if venc > 0 else "activo"
        analistas.append(
            {
                "id": str(u.id),
                "nombre": u.full_name or u.username,
                "iniciales": _iniciales(u.full_name or u.username),
                "color": "#6366f1",
                "asig": tot,
                "comp": closed,
                "pend": open_n,
                "avance": avance,
                "activas": open_n,
                "vencer": 0,
                "vencer_txt": "—",
                "riesgo": riesgo,
                "liberaciones_activas": 0,
                "temas_emergentes": temas,
            }
        )

    con_carga = [a for a in analistas if a["asig"] > 0]
    prom_avance = int(sum(a["avance"] for a in con_carga) / len(con_carga)) if con_carga else 0
    max_tareas = max((a["asig"] for a in analistas), default=0)

    kpis = [
        {
            "title": "Analistas activos (con carga)",
            "value": str(len(con_carga)),
            "sub": "asignación > 0",
            "border": "border-b-blue-500",
            "valColor": "text-blue-400",
            "subColor": "text-muted-foreground",
        },
        {
            "title": "Tareas vencidas (SLA) — global",
            "value": str(venc_sum),
            "sub": "revisar backlog",
            "border": "border-b-red-500" if venc_sum else "border-b-emerald-500",
            "valColor": "text-red-500" if venc_sum else "text-emerald-400",
            "subColor": "text-muted-foreground",
        },
        {
            "title": "Avance promedio individual",
            "value": f"{prom_avance}%",
            "sub": "cierre de hallazgos",
            "border": "border-b-amber-500",
            "valColor": "text-amber-300",
            "subColor": "text-muted-foreground",
        },
        {
            "title": "Carga máxima individual",
            "value": str(max_tareas),
            "sub": "hallazgos asignados",
            "border": "border-b-violet-500",
            "valColor": "text-violet-300",
            "subColor": "text-muted-foreground",
        },
    ]

    detalle: dict[str, dict] = {}
    for a in analistas:
        uid = a["id"]
        tareas = []
        vrows = (
            (
                await db.execute(
                    select(Vulnerabilidad)
                    .where(*vcond, Vulnerabilidad.user_id == UUID(uid))
                    .order_by(Vulnerabilidad.created_at.desc())
                    .limit(50)
                )
            )
            .scalars()
            .all()
        )
        for v in vrows:
            tareas.append(
                {
                    "id": str(v.id),
                    "titulo": v.titulo,
                    "programa": v.fuente,
                    "estado": v.estado,
                    "tags": [v.severidad],
                    "color_dot": "#ef4444" if "critica" in (v.severidad or "").lower() else "#94a3b8",
                }
            )
        detalle[uid] = {
            "rol": "analyst",
            "email": next((u.email for u in user_rows if str(u.id) == uid), "") or "—",
            "stats": {
                "progs": a["asig"],
                "temas": a["temas_emergentes"],
                "liberaciones": a["liberaciones_activas"],
                "comp": a["comp"],
                "pend": a["pend"],
                "avance": f"{a['avance']}%",
            },
            "historico": [{"mes": "mes", "pct": a["avance"]}],
            "actividad_reciente": [],
            "tareas": tareas,
        }

    salud = 72 if prom_avance >= 50 else 45

    return {
        "kpis": kpis,
        "salud_equipo_sidebar": {
            "porcentaje": salud,
            "estado_texto": "estable" if salud >= 60 else "riesgo",
            "color": "#22c55e" if salud >= 60 else "#eab308",
            "historial_sparkline": [salud, salud - 2, salud + 1, salud],
        },
        "analistas": analistas,
        "detalle": detalle,
        "applied_filters": _hfd(
            direccion_id=None,
            subdireccion_id=subdireccion_id,
            gerencia_id=gerencia_id,
            organizacion_id=organizacion_id,
            celula_id=celula_id,
        ),
    }
