"""Utilidades de telemetría para SCR."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import run_in_transaction
from app.models.code_security_review import CodeSecurityReview
from app.models.scr_analysis_metric import ScrAnalysisMetric

PRICE_PER_1K_OUTPUT_TOKENS_USD = {
    "anthropic": 0.015,
    "openai": 0.010,
    "openrouter": 0.010,
    "gemini": 0.007,
    "nvidia_nim": 0.008,
    "litellm": 0.010,
    "lmstudio": 0.0,
    "ollama": 0.0,
}


def now_utc() -> datetime:
    return datetime.now(UTC)


def duration_ms(started_at: datetime, completed_at: datetime | None = None) -> int:
    finished_at = completed_at or now_utc()
    return max(0, int((finished_at - started_at).total_seconds() * 1000))


def estimate_llm_cost(provider: str | None, tokens_used: int | None) -> float:
    if not provider or not tokens_used:
        return 0.0
    return round((max(tokens_used, 0) / 1000) * PRICE_PER_1K_OUTPUT_TOKENS_USD.get(provider, 0.0), 6)


async def record_scr_metric(
    db: AsyncSession,
    *,
    review_id: UUID,
    user_id: UUID,
    agent: str,
    started_at: datetime,
    provider: str | None = None,
    model: str | None = None,
    tokens_used: int | None = None,
    status: str = "success",
    error: str | None = None,
    extra: dict[str, Any] | None = None,
) -> ScrAnalysisMetric:
    completed_at = now_utc()
    tokens = max(int(tokens_used or 0), 0)
    metric = ScrAnalysisMetric(
        review_id=review_id,
        user_id=user_id,
        agent=agent,
        provider=provider,
        model=model,
        started_at=started_at,
        completed_at=completed_at,
        duration_ms=duration_ms(started_at, completed_at),
        tokens_used=tokens,
        estimated_cost_usd=estimate_llm_cost(provider, tokens),
        status=status,
        error=error[:1000] if error else None,
        extra=extra or {},
    )
    db.add(metric)
    await db.flush()
    return metric


async def record_scr_metric_durable(**kwargs: Any) -> ScrAnalysisMetric:
    """Persiste telemetría en transacción propia para no perder costo en rollbacks."""

    async def _record(db: AsyncSession) -> ScrAnalysisMetric:
        return await record_scr_metric(db, **kwargs)

    return await run_in_transaction(_record)


async def persist_scr_review_progress_durable(
    review_id: UUID,
    *,
    progreso: int,
    agente: str,
    actividad: str,
) -> None:
    """Actualiza progreso visible para polling sin depender del commit de la transacción larga del pipeline."""

    async def _upd(db: AsyncSession) -> None:
        stmt = (
            select(CodeSecurityReview)
            .where(CodeSecurityReview.id == review_id)
            .where(CodeSecurityReview.deleted_at.is_(None))
        )
        r = (await db.execute(stmt)).scalar_one_or_none()
        if r is None:
            return
        r.progreso = max(0, min(100, int(progreso)))
        r.agente_actual = (agente or "")[:64] or None
        r.actividad = (actividad or "")[:512] or None
        await db.flush()

    await run_in_transaction(_upd)


async def aggregate_review_metrics(db: AsyncSession, review_id: UUID) -> tuple[int, float, int]:
    row = (
        await db.execute(
            select(
                func.coalesce(func.sum(ScrAnalysisMetric.tokens_used), 0),
                func.coalesce(func.sum(ScrAnalysisMetric.estimated_cost_usd), 0),
                func.coalesce(func.sum(ScrAnalysisMetric.duration_ms), 0),
            ).where(ScrAnalysisMetric.review_id == review_id)
        )
    ).one()
    return int(row[0] or 0), float(row[1] or 0), int(row[2] or 0)
