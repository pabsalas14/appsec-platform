"""G2 — Reglas automáticas §14.3: disparadores hacia `notificacions` (idempotente por ventana de tiempo)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.actualizacion_tema import ActualizacionTema
from app.models.notificacion import Notificacion
from app.models.tema_emergente import TemaEmergente
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad
from app.schemas.notificacion import NotificacionCreate
from app.services.json_setting import get_json_setting
from app.services.notificacion_service import notificacion_svc


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
        if isinstance(pr, dict) and pr.get("notificaciones_automaticas") is False:
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
        if isinstance(pr, dict) and pr.get("notificaciones_automaticas") is False:
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
        if isinstance(pr, dict) and pr.get("notificaciones_automaticas") is False:
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
    return {
        "sla_riesgo_creadas": n,
        "tema_estancado_creadas": t,
        "vulnerabilidad_inactiva_creadas": v,
    }
