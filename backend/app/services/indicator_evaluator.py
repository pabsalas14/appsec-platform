"""Safe evaluation of `IndicadorFormula.formula` JSON (E1) — no dynamic code execution."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from app.models.control_seguridad import ControlSeguridad
from app.models.hallazgo_sast import HallazgoSast
from app.models.pipeline_release import PipelineRelease
from app.models.service_release import ServiceRelease
from app.models.vulnerabilidad import Vulnerabilidad


def _norm_sev(v: str) -> str:
    s = (v or "").strip()
    m = s.upper()
    if m == "CRITICA":
        return "Critica"
    if m == "ALTA":
        return "Alta"
    if m == "MEDIA":
        return "Media"
    if m == "BAJA":
        return "Baja"
    return s


def _apply_filters(model_col: dict[str, InstrumentedAttribute], filters: list[dict[str, Any]], stmt):
    for f in filters or []:
        field = f.get("field")
        value = f.get("value")
        op = (f.get("op") or "eq").lower()
        if not field or field not in model_col:
            continue
        col = model_col[field]
        if op in ("in", "in_list") and isinstance(value, (list, tuple)) and value:
            vals = [_norm_sev(str(x)) for x in value] if field == "severidad" else [str(x) for x in value]
            if field == "resultado":
                stmt = stmt.where(func.lower(col).in_([str(v).lower() for v in vals]))
            else:
                stmt = stmt.where(col.in_(vals))
            continue
        if op in ("not_in", "not_in_list") and isinstance(value, (list, tuple)) and value:
            vals = [_norm_sev(str(x)) for x in value] if field == "severidad" else [str(x) for x in value]
            stmt = stmt.where(~col.in_(vals))
            continue
        if (
            op == "eq"
            and isinstance(value, (list, tuple))
            and value
            and field
            in (
                "severidad",
                "estado",
                "fuente",
            )
        ):
            vals = [_norm_sev(str(x)) for x in value] if field == "severidad" else [str(x) for x in value]
            stmt = stmt.where(col.in_(vals))
            continue
        if field in ("severidad", "estado", "fuente", "tipo", "resultado"):
            val = _norm_sev(value) if field == "severidad" else value
            stmt = stmt.where(func.lower(col) == str(val).lower())
        else:
            stmt = stmt.where(col == value)
    return stmt


class IndicatorEvaluationError(ValueError):
    """User-facing formula/entity error."""


async def _count_entity(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    entity: str,
    filters: list[dict[str, Any]] | None,
) -> float:
    if entity in ("hallazgo", "hallazgo_sast"):
        model_col = {
            "severidad": HallazgoSast.severidad,
            "estado": HallazgoSast.estado,
        }
        stmt = (
            select(func.count())
            .select_from(HallazgoSast)
            .where(
                HallazgoSast.user_id == user_id,
                HallazgoSast.deleted_at.is_(None),
            )
        )
        stmt = _apply_filters(model_col, filters or [], stmt)
        return float((await db.execute(stmt)).scalar_one())

    if entity in ("vulnerabilidad", "vulnerabilidades", "vuln"):
        now = datetime.now(UTC)
        model_col = {
            "severidad": Vulnerabilidad.severidad,
            "estado": Vulnerabilidad.estado,
            "fuente": Vulnerabilidad.fuente,
        }
        stmt = (
            select(func.count())
            .select_from(Vulnerabilidad)
            .where(
                Vulnerabilidad.user_id == user_id,
                Vulnerabilidad.deleted_at.is_(None),
            )
        )
        for f in filters or []:
            if f.get("field") == "sla" and str(f.get("value", "")).lower() == "vencido":
                stmt = stmt.where(
                    Vulnerabilidad.fecha_limite_sla.isnot(None),
                    Vulnerabilidad.fecha_limite_sla < now,
                )
                continue
        # filtros de campo distintos a preset
        other = [x for x in (filters or []) if x.get("field") != "sla"]
        stmt = _apply_filters(model_col, other, stmt)
        return float((await db.execute(stmt)).scalar_one())

    if entity in ("service_release", "liberacion", "release"):
        # BRD: releases (placeholder; join a severidad vía pipeline en fases futuras)
        stmt = (
            select(func.count())
            .select_from(ServiceRelease)
            .where(
                ServiceRelease.user_id == user_id,
                ServiceRelease.deleted_at.is_(None),
            )
        )
        return float((await db.execute(stmt)).scalar_one())

    if entity in ("pipeline_release", "pipeline"):
        model_col = {
            "tipo": PipelineRelease.tipo,
            "resultado": PipelineRelease.resultado,
        }
        stmt = (
            select(func.count())
            .select_from(PipelineRelease)
            .where(
                PipelineRelease.user_id == user_id,
                PipelineRelease.deleted_at.is_(None),
            )
        )
        stmt = _apply_filters(model_col, filters or [], stmt)
        return float((await db.execute(stmt)).scalar_one())

    if entity in ("control_seguridad", "control", "controles"):
        model_col = {
            "tipo": ControlSeguridad.tipo,
            "obligatorio": ControlSeguridad.obligatorio,
        }
        stmt = (
            select(func.count())
            .select_from(ControlSeguridad)
            .where(
                ControlSeguridad.user_id == user_id,
                ControlSeguridad.deleted_at.is_(None),
            )
        )
        stmt = _apply_filters(model_col, filters or [], stmt)
        return float((await db.execute(stmt)).scalar_one())

    raise IndicatorEvaluationError(f"Entidad de conteo no soportada: {entity!r}")


def _apply_agg(aggregation: str, values: list[float]) -> float:
    if not values:
        return 0.0
    if aggregation == "sum":
        return float(sum(values))
    if aggregation == "avg":
        return float(sum(values) / len(values))
    if aggregation == "min":
        return float(min(values))
    if aggregation == "max":
        return float(max(values))
    raise IndicatorEvaluationError(f"Agregación no soportada: {aggregation!r}")


async def evaluate_formula(
    db: AsyncSession,
    formula: dict[str, Any],
    *,
    user_id: uuid.UUID,
) -> float:
    if not isinstance(formula, dict):
        raise IndicatorEvaluationError("La fórmula debe ser un objeto JSON")

    ftype = formula.get("type")
    if ftype == "constant":
        try:
            return float(formula.get("value", 0))
        except (TypeError, ValueError) as e:
            raise IndicatorEvaluationError("constant.value debe ser numérico") from e

    if ftype in (None, "count"):
        entity = formula.get("entity", "vulnerabilidad")
        return await _count_entity(db, user_id=user_id, entity=entity, filters=formula.get("filters"))

    if ftype == "aggregate":
        agg = formula.get("aggregation", "sum")
        items = formula.get("items") or []
        values: list[float] = []
        for it in items:
            if not isinstance(it, dict):
                continue
            values.append(await evaluate_formula(db, it, user_id=user_id))
        return _apply_agg(agg, values)

    if ftype == "ratio":
        num = formula.get("numerator") or {}
        den = formula.get("denominator") or {}
        scale = float(formula.get("scale", 1.0))
        a = await evaluate_formula(db, num, user_id=user_id) if num else 0.0
        b = await evaluate_formula(db, den, user_id=user_id) if den else 0.0
        if b == 0.0:
            return 0.0
        return float(a / b) * scale

    raise IndicatorEvaluationError(f"Tipo de fórmula no soportado: {ftype!r}")


def status_for_value(
    value: float,
    *,
    threshold_green: float | None,
    threshold_yellow: float | None,
    threshold_red: float | None,
    lower_is_better: bool = True,
) -> str:
    """
    For risk/count indicators, lower values are better by default.
    green <= threshold_green, yellow <= threshold_yellow, else red (if thresholds set).
    """
    if threshold_green is None and threshold_yellow is None and threshold_red is None:
        return "unknown"
    if lower_is_better:
        tg = threshold_green if threshold_green is not None else float("inf")
        ty = threshold_yellow if threshold_yellow is not None else float("inf")
        if value <= tg:
            return "green"
        if value <= ty:
            return "yellow"
        return "red"
    # higher is better
    tg = threshold_green if threshold_green is not None else float("-inf")
    ty = threshold_yellow if threshold_yellow is not None else float("-inf")
    if value >= tg:
        return "green"
    if value >= ty:
        return "yellow"
    return "red"
