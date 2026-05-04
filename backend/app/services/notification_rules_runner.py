"""G2 — Reglas automáticas §14.3: disparadores hacia `notificacions` (idempotente por ventana de tiempo)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.actualizacion_tema import ActualizacionTema
from app.models.iniciativa import Iniciativa
from app.models.notificacion import Notificacion
from app.models.plan_remediacion import PlanRemediacion
from app.models.tema_emergente import TemaEmergente
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad
from app.schemas.notificacion import NotificacionCreate
from app.services.json_setting import get_json_setting
from app.services.notificacion_service import notificacion_svc


_RULE_KEY_ALIASES: dict[str, tuple[str, ...]] = {
    "iniciativa_fecha_fin_vencida": ("iniciativa_fecha_fin_vencida", "iniciativa_vencida"),
    "plan_remediacion_fecha_limite_vencida": (
        "plan_remediacion_fecha_limite_vencida",
        "plan_remediacion_vencido",
    ),
}


def _user_wants_rule(pr: object | None, *, rule_key: str) -> bool:
    """Respeta `notificaciones_automaticas` y claves anidadas en `preferences.notifications`."""
    if not isinstance(pr, dict):
        return True
    if pr.get("notificaciones_automaticas") is False:
        return False
    nested = pr.get("notifications")
    if isinstance(nested, dict):
        for k in _RULE_KEY_ALIASES.get(rule_key, (rule_key,)):
            if nested.get(k) is False:
                return False
    return True


async def _already_sent_recently(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    prefix: str,
    since: datetime,
) -> bool:
    q = select(Notificacion.id).where(
        Notificacion.user_id == user_id,
        Notificacion.titulo.like(f"{prefix}%"),
        Notificacion.created_at >= since,
    )
    return (await db.execute(q)).scalar_one_or_none() is not None


def _as_int_umbrales(d: object, k: str, default: int) -> int:
    if not isinstance(d, dict):
        return default
    v = d.get(k)
    try:
        return int(v)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default


async def _leer_umbrales_notificacion(db: AsyncSession) -> dict[str, int]:
    raw = await get_json_setting(db, "notificacion.umbrales", None)
    return {
        "sla_dias_anticipacion": _as_int_umbrales(raw, "sla_dias_anticipacion", 7),
        "tema_bitacora_sin_entrada_dias": _as_int_umbrales(raw, "tema_bitacora_sin_entrada_dias", 30),
        "vulnerabilidad_inactiva_dias": _as_int_umbrales(raw, "vulnerabilidad_inactiva_dias", 60),
    }


async def run_notification_rules_sla_riesgo(
    db: AsyncSession,
    *,
    days_ahead: int = 7,
) -> int:
    """
    Crea notificaciones para vulnerabilidades cuyo `fecha_limite_sla` cae
    en los próximos `days_ahead` días (no vencida aún). Una alerta por (usuario, vulnerabilidad)
    en ventana de 24h.
    """
    now = datetime.now(UTC)
    horizon = now + timedelta(days=days_ahead)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if day_start.tzinfo is None:
        day_start = day_start.replace(tzinfo=UTC)

    result = await db.execute(
        select(Vulnerabilidad).where(
            Vulnerabilidad.deleted_at.is_(None),
            Vulnerabilidad.fecha_limite_sla.isnot(None),
            Vulnerabilidad.fecha_limite_sla > now,
            Vulnerabilidad.fecha_limite_sla <= horizon,
        )
    )
    rows = list(result.scalars().all())
    created = 0
    for v in rows:
        uid = v.responsable_id or v.user_id
        urow = await db.execute(select(User).where(User.id == uid))
        u = urow.scalar_one_or_none()
        pr = u.preferences if u else None
        if not _user_wants_rule(pr, rule_key="sla_vulnerabilidad"):
            continue
        prefix = f"[SLA] Vulnerabilidad {v.id}"
        if await _already_sent_recently(db, user_id=uid, prefix=prefix, since=day_start):
            continue
        create_in = NotificacionCreate(
            titulo=f"{prefix}: revisión antes de {v.fecha_limite_sla.date().isoformat()}",
            cuerpo=f"Fuente {v.fuente}, severidad {v.severidad}.",
            leida=False,
        )
        await notificacion_svc.create(db, create_in, extra={"user_id": uid})
        created += 1
    if created:
        await db.flush()
        logger.info(
            "notificacion.rules.sla_riesgo",
            extra={"event": "notificacion.rules.sla_riesgo", "created": created},
        )
    return created


_TEMA_CERRADOS = frozenset({"Cerrado", "Cerrada", "Archivado", "Cerrada con conclusión"})


async def run_tema_emergente_estancado(
    db: AsyncSession,
    *,
    days_without_update: int = 30,
) -> int:
    """
    P12: «Tema estancado» si no hay nueva entrada en la bitácora (`actualizacion_temas`)
    en `days_without_update` días. Sin bitácora aún, se toma `temas_emergentes.created_at` como
    actividad base (criterio: sin entrada nueva = sin movimiento en bitácora).
    """
    now = datetime.now(UTC)
    cutoff = now - timedelta(days=days_without_update)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if day_start.tzinfo is None:
        day_start = day_start.replace(tzinfo=UTC)

    last_bit = (
        select(ActualizacionTema.tema_id, func.max(ActualizacionTema.created_at).label("last_at"))
        .where(ActualizacionTema.deleted_at.is_(None))
        .group_by(ActualizacionTema.tema_id)
        .subquery()
    )
    last_act = func.coalesce(last_bit.c.last_at, TemaEmergente.created_at)
    result = await db.execute(
        select(TemaEmergente)
        .outerjoin(last_bit, last_bit.c.tema_id == TemaEmergente.id)
        .where(
            TemaEmergente.deleted_at.is_(None),
            TemaEmergente.estado.notin_(_TEMA_CERRADOS),  # type: ignore[arg-type]
            last_act < cutoff,
        )
    )
    rows = list(result.scalars().all())
    created = 0
    for t in rows:
        uid = t.user_id
        urow = await db.execute(select(User).where(User.id == uid))
        u = urow.scalar_one_or_none()
        pr = u.preferences if u else None
        if not _user_wants_rule(pr, rule_key="tema_estancado"):
            continue
        prefix = f"[TEMA] {t.id}"
        if await _already_sent_recently(db, user_id=uid, prefix=prefix, since=day_start):
            continue
        create_in = NotificacionCreate(
            titulo=f"{prefix}: bitácora sin movimiento {days_without_update}+ días — {t.titulo[:80]}",
            cuerpo=f"Estado {t.estado!r}, tipo {t.tipo!r}. Añade una actualización en la bitácora.",
            leida=False,
        )
        await notificacion_svc.create(db, create_in, extra={"user_id": uid})
        created += 1
    if created:
        await db.flush()
        logger.info(
            "notificacion.rules.tema_estancado",
            extra={"event": "notificacion.rules.tema_estancado", "created": created},
        )
    return created


async def run_vulnerabilidad_inactiva(
    db: AsyncSession,
    *,
    days_without_update: int = 60,
) -> int:
    """
    §14.3 — Vulnerabilidad sin actualización (proxy).
    """
    now = datetime.now(UTC)
    cutoff = now - timedelta(days=days_without_update)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if day_start.tzinfo is None:
        day_start = day_start.replace(tzinfo=UTC)

    result = await db.execute(
        select(Vulnerabilidad).where(
            Vulnerabilidad.deleted_at.is_(None),
            Vulnerabilidad.updated_at < cutoff,
        )
    )
    rows = list(result.scalars().all())
    created = 0
    for v in rows:
        uid = v.responsable_id or v.user_id
        urow = await db.execute(select(User).where(User.id == uid))
        u = urow.scalar_one_or_none()
        pr = u.preferences if u else None
        if not _user_wants_rule(pr, rule_key="vulnerabilidad_inactiva"):
            continue
        prefix = f"[INACTIVA] {v.id}"
        if await _already_sent_recently(db, user_id=uid, prefix=prefix, since=day_start):
            continue
        create_in = NotificacionCreate(
            titulo=f"{prefix}: sin actualizar en {days_without_update}+ días",
            cuerpo=f"Estado {v.estado!r}, {v.titulo[:120]}",
            leida=False,
        )
        await notificacion_svc.create(db, create_in, extra={"user_id": uid})
        created += 1
    if created:
        await db.flush()
        logger.info(
            "notificacion.rules.vulnerabilidad_inactiva",
            extra={"event": "notificacion.rules.vulnerabilidad_inactiva", "created": created},
        )
    return created


_INICIATIVA_CERRADOS = frozenset({"Cerrado", "Cerrada", "Completado", "Cancelado"})


async def run_iniciativas_vencidas(db: AsyncSession) -> int:
    """Iniciativa con fecha_fin_estimada pasada y no cerrada."""
    now = datetime.now(UTC)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if day_start.tzinfo is None:
        day_start = day_start.replace(tzinfo=UTC)

    result = await db.execute(
        select(Iniciativa).where(
            Iniciativa.deleted_at.is_(None),
            Iniciativa.fecha_fin_estimada.isnot(None),
            Iniciativa.fecha_fin_estimada < now,
            ~Iniciativa.estado.in_(_INICIATIVA_CERRADOS),  # type: ignore[arg-type]
        )
    )
    rows = list(result.scalars().all())
    created = 0
    for it in rows:
        uid = it.user_id
        urow = await db.execute(select(User).where(User.id == uid))
        u = urow.scalar_one_or_none()
        pr = u.preferences if u else None
        if not _user_wants_rule(pr, rule_key="iniciativa_fecha_fin_vencida"):
            continue
        prefix = f"[INICIATIVA] {it.id}"
        if await _already_sent_recently(db, user_id=uid, prefix=prefix, since=day_start):
            continue
        await notificacion_svc.create(
            db,
            NotificacionCreate(
                titulo=f"{prefix}: fecha estimada vencida — {it.titulo[:100]}",
                cuerpo=f"Estado {it.estado!r}. Revisa la fecha_fin_estimada.",
                leida=False,
            ),
            extra={"user_id": uid},
        )
        created += 1
    if created:
        await db.flush()
        logger.info(
            "notificacion.rules.iniciativa_vencida",
            extra={"event": "notificacion.rules.iniciativa_vencida", "created": created},
        )
    return created


_PLAN_CERRADOS = frozenset({"Cerrado", "Completado", "Cancelado", "Verificado"})


async def run_planes_remediacion_vencidos(db: AsyncSession) -> int:
    """Plan de remediación con fecha_limite pasada y estado abierto."""
    now = datetime.now(UTC)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if day_start.tzinfo is None:
        day_start = day_start.replace(tzinfo=UTC)

    result = await db.execute(
        select(PlanRemediacion).where(
            PlanRemediacion.deleted_at.is_(None),
            PlanRemediacion.fecha_limite < now,
            ~PlanRemediacion.estado.in_(_PLAN_CERRADOS),  # type: ignore[arg-type]
        )
    )
    rows = list(result.scalars().all())
    created = 0
    for pl in rows:
        uid = pl.user_id
        urow = await db.execute(select(User).where(User.id == uid))
        u = urow.scalar_one_or_none()
        pr = u.preferences if u else None
        if not _user_wants_rule(pr, rule_key="plan_remediacion_fecha_limite_vencida"):
            continue
        prefix = f"[PLAN_REM] {pl.id}"
        if await _already_sent_recently(db, user_id=uid, prefix=prefix, since=day_start):
            continue
        await notificacion_svc.create(
            db,
            NotificacionCreate(
                titulo=f"{prefix}: fecha límite vencida",
                cuerpo=f"Estado {pl.estado!r}. Responsable indicado: {pl.responsable[:120]}",
                leida=False,
            ),
            extra={"user_id": uid},
        )
        created += 1
    if created:
        await db.flush()
        logger.info(
            "notificacion.rules.plan_remediacion_vencido",
            extra={"event": "notificacion.rules.plan_remediacion_vencido", "created": created},
        )
    return created


async def run_all_notification_rules(db: AsyncSession) -> dict[str, int]:
    """Punto de entrada: ejecuta todas las reglas §14.3 (extensible), leyendo umbrales de admin."""
    u = await _leer_umbrales_notificacion(db)
    n = await run_notification_rules_sla_riesgo(
        db,
        days_ahead=u["sla_dias_anticipacion"],
    )
    t = await run_tema_emergente_estancado(
        db,
        days_without_update=u["tema_bitacora_sin_entrada_dias"],
    )
    v = await run_vulnerabilidad_inactiva(
        db,
        days_without_update=u["vulnerabilidad_inactiva_dias"],
    )
    ini = await run_iniciativas_vencidas(db)
    pr = await run_planes_remediacion_vencidos(db)
    return {
        "sla_riesgo_creadas": n,
        "tema_estancado_creadas": t,
        "vulnerabilidad_inactiva_creadas": v,
        "iniciativa_vencida_creadas": ini,
        "plan_remediacion_vencido_creadas": pr,
    }
