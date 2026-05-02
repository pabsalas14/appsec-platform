"""Pipeline asíncrono de análisis SCR (fases 4-6)."""

from __future__ import annotations

import os
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.database import run_in_transaction
from app.models.code_security_event import CodeSecurityEvent
from app.models.code_security_finding import CodeSecurityFinding
from app.models.code_security_report import CodeSecurityReport
from app.models.code_security_review import CodeSecurityReview
from app.services.ia_provider import AIProviderType
from app.services.scr_agents import fingerprint_for_finding, run_detective_stub
from app.services.scr_agents.scr_detective_agent import run_detective_real
from app.services.scr_agents.scr_fiscal_agent import run_fiscal_real
from app.services.scr_credentials import resolve_agent_llm_runtime, resolve_github_token_plain, resolve_scr_llm_runtime
from app.services.scr_github_context import scr_github_bearer_token
from app.services.scr_inspector_agent import run_inspector_stub
from app.services.scr_llm_catalog import default_base_url
from app.services.scr_telemetry import (
    aggregate_review_metrics,
    duration_ms,
    now_utc,
    persist_scr_review_progress_durable,
    record_scr_metric_durable,
)


def _llm_from_review(review: CodeSecurityReview) -> tuple[AIProviderType, str, float, int]:
    cfg = review.scr_config or {}
    raw = (cfg.get("llm_provider") or "ollama").strip().lower()
    try:
        provider_enum = AIProviderType(raw)
    except ValueError:
        provider_enum = AIProviderType.OLLAMA
    model = (cfg.get("llm_model") or "").strip() or (
        "llama3.2" if provider_enum == AIProviderType.OLLAMA else "claude-sonnet-4-20250514"
    )
    temperature = float(cfg.get("temperature", 0.3))
    max_tokens = int(cfg.get("max_tokens", 4096))
    return provider_enum, model, temperature, max_tokens


def _normalize_github_commits(raw: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Unifica claves para Detective (hash/author/message)."""
    out: list[dict[str, Any]] = []
    for c in raw:
        ch = c.get("commit_hash") or c.get("hash") or ""
        out.append(
            {
                "hash": (ch or "")[:40],
                "commit_hash": (ch or "")[:40],
                "author": c.get("author") or c.get("autor") or "unknown",
                "autor": c.get("autor") or c.get("author") or "unknown",
                "timestamp": c.get("timestamp"),
                "message": c.get("message") or c.get("mensaje") or "",
                "mensaje": c.get("mensaje") or c.get("message") or "",
                "files": list(c.get("files") or []),
                "lines_changed": int(c.get("lines_changed") or 0),
            }
        )
    return out


async def _notify_scr_progress(
    review_id: uuid.UUID,
    progreso: int,
    agente: str,
    actividad: str,
) -> None:
    await persist_scr_review_progress_durable(
        review_id,
        progreso=progreso,
        agente=agente,
        actividad=actividad,
    )


async def _merge_durable_progress_into_session(db: AsyncSession, review: CodeSecurityReview) -> None:
    """Tras un commit durable del progreso, alinea el objeto ORM para que flush() no revierta valores."""

    row = (
        await db.execute(
            select(CodeSecurityReview.progreso, CodeSecurityReview.agente_actual, CodeSecurityReview.actividad).where(
                CodeSecurityReview.id == review.id
            )
        )
    ).one_or_none()
    if row is None:
        return
    review.progreso = int(row[0])
    review.agente_actual = row[1]
    review.actividad = row[2]


async def _prepare_scr_session(db: AsyncSession, review_id: uuid.UUID) -> bool:
    """Limpia resultados previos y deja la revisión en ANALYZING (transacción corta, commit aparte)."""
    stmt = (
        select(CodeSecurityReview)
        .where(CodeSecurityReview.id == review_id)
        .where(CodeSecurityReview.deleted_at.is_(None))
    )
    res = await db.execute(stmt)
    review = res.scalar_one_or_none()
    if review is None:
        logger.warning(
            "scr.pipeline.review_missing",
            extra={"event": "scr.pipeline.review_missing", "review_id": str(review_id)},
        )
        return False
    if review.estado != "PENDING":
        logger.warning(
            "scr.pipeline.review_not_pending",
            extra={
                "event": "scr.pipeline.review_not_pending",
                "review_id": str(review_id),
                "estado": review.estado,
            },
        )
        return False

    await db.execute(delete(CodeSecurityEvent).where(CodeSecurityEvent.review_id == review_id))
    await db.execute(delete(CodeSecurityReport).where(CodeSecurityReport.review_id == review_id))
    await db.execute(delete(CodeSecurityFinding).where(CodeSecurityFinding.review_id == review_id))
    await db.flush()

    review.estado = "ANALYZING"
    review.started_at = now_utc()
    review.completed_at = None
    review.duration_ms = None
    review.total_tokens_used = 0
    review.estimated_cost_usd = 0.0
    await db.flush()
    return True


async def _raise_if_cancelled(db: AsyncSession, review: CodeSecurityReview) -> None:
    await db.refresh(review)
    if review.estado == "CANCELLED":
        raise RuntimeError("SCR_CANCELLED")


async def _execute_scr_analysis_core(db: AsyncSession, review_id: uuid.UUID) -> None:
    """Inspector → Detective → Fiscal. Requiere revisión ya en ANALYZING (tras ``_prepare_scr_session``)."""
    stmt = (
        select(CodeSecurityReview)
        .where(CodeSecurityReview.id == review_id)
        .where(CodeSecurityReview.deleted_at.is_(None))
    )
    res = await db.execute(stmt)
    review = res.scalar_one_or_none()
    if review is None:
        logger.warning(
            "scr.pipeline.review_missing",
            extra={"event": "scr.pipeline.review_missing", "review_id": str(review_id)},
        )
        return
    if review.estado != "ANALYZING":
        logger.warning(
            "scr.pipeline.review_not_analyzing",
            extra={
                "event": "scr.pipeline.review_not_analyzing",
                "review_id": str(review_id),
                "estado": review.estado,
            },
        )
        return

    await _raise_if_cancelled(db, review)

    llm_rt = await resolve_scr_llm_runtime(db, review)
    if llm_rt:
        provider_enum = llm_rt.provider
        llm_model = llm_rt.model
        temperature = llm_rt.temperature
        max_tokens = llm_rt.max_tokens
        llm_api_key = llm_rt.api_key
        llm_base_url = llm_rt.base_url
    else:
        provider_enum, llm_model, temperature, max_tokens = _llm_from_review(review)
        llm_api_key = ""
        llm_base_url = default_base_url(provider_enum.value)
    gh_plain = await resolve_github_token_plain(db, review)
    inspector_rt = await resolve_agent_llm_runtime(db, review, "inspector")
    detective_rt = await resolve_agent_llm_runtime(db, review, "detective")
    fiscal_rt = await resolve_agent_llm_runtime(db, review, "fiscal")

    try:
        from app.services.ia_provider import get_ai_provider

        health_rt = inspector_rt or llm_rt
        pkwargs: dict[str, Any] = {"model": (health_rt.model if health_rt else llm_model)}
        if health_rt and health_rt.api_key:
            pkwargs["api_key"] = health_rt.api_key
        elif llm_api_key:
            pkwargs["api_key"] = llm_api_key
        if health_rt and health_rt.base_url:
            pkwargs["base_url"] = health_rt.base_url
        elif llm_base_url:
            pkwargs["base_url"] = llm_base_url
        if provider_enum == AIProviderType.OLLAMA and "base_url" not in pkwargs:
            pkwargs["base_url"] = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

        provider_obj = get_ai_provider(health_rt.provider if health_rt else provider_enum, **pkwargs)
        healthy = await provider_obj.health_check()
        if not healthy:
            logger.warning(
                "scr.pipeline.provider_health_soft_fail",
                extra={
                    "review_id": str(review_id),
                    "provider": provider_enum.value,
                    "hint": "Inspector puede usar stub si faltan credenciales",
                },
            )
    except Exception as e:
        logger.warning(
            "scr.pipeline.provider_health_skipped",
            extra={"review_id": str(review_id), "error": str(e)[:200]},
        )

    source_files: dict[str, str] = {}
    commits: list[dict[str, Any]] = []

    # PASO 1: Git (usa PAT de plataforma / env en contexto)
    with scr_github_bearer_token(gh_plain):
        try:
            from app.services.scr_github_client import clone_and_read_repo, get_commits

            if not review.url_repositorio:
                raise ValueError("URL del repositorio no configurada")

            logger.info(
                "scr.pipeline.cloning",
                extra={"review_id": str(review_id), "url": review.url_repositorio, "branch": review.rama_analizar},
            )

            source_files = await clone_and_read_repo(review.url_repositorio, review.rama_analizar or "main")
            if not source_files:
                logger.warning(
                    "scr.pipeline.no_files",
                    extra={"review_id": str(review_id), "url": review.url_repositorio},
                )
                source_files = {"_empty": "# No hay archivos de código"}

            await _notify_scr_progress(
                review.id,
                22,
                "Inspector",
                "Repositorio clonado; preparando Inspector…",
            )
            await _merge_durable_progress_into_session(db, review)

            try:
                commits_raw = await get_commits(review.url_repositorio, review.rama_analizar or "main", limit=50)
                commits = _normalize_github_commits(commits_raw)

                if review.last_analyzed_commit and commits:
                    new_commits = [
                        c for c in commits if (c.get("hash") or c.get("commit_hash")) != review.last_analyzed_commit
                    ]
                    was_incremental = len(new_commits) < len(commits)
                    logger.info(
                        "scr.pipeline.incremental_analysis",
                        extra={
                            "review_id": str(review_id),
                            "total_commits": len(commits),
                            "new_commits": len(new_commits),
                            "is_incremental": was_incremental,
                        },
                    )
                    commits = new_commits
                    if was_incremental:
                        review.analysis_version = (review.analysis_version or 1) + 1
                        logger.info(
                            "scr.pipeline.analysis_version_incremented",
                            extra={"review_id": str(review_id), "new_version": review.analysis_version},
                        )

            except Exception as e:
                logger.error(
                    "scr.pipeline.commits_error",
                    extra={"review_id": str(review_id), "error": str(e)[:200]},
                )
                commits = []

        except Exception as e:
            logger.error(
                "scr.pipeline.git_error",
                extra={"review_id": str(review_id), "error": str(e)[:500]},
            )
            await _notify_scr_progress(
                review.id,
                14,
                "Git",
                f"Error Git: {str(e)[:160]}",
            )
            await _merge_durable_progress_into_session(db, review)
            raise

    await _notify_scr_progress(review.id, 28, "Inspector", "Ejecutando Inspector (LLM)…")
    await _merge_durable_progress_into_session(db, review)
    await _raise_if_cancelled(db, review)

    # PASO 2: Inspector (LLM real o fallback a stub)
    inspector_usage: dict[str, Any] = {}
    inspector_started_at = now_utc()
    fail_after_inspector_metric = False
    try:
        from app.services.scr_inspector_agent import run_inspector_real

        inspector_out = await run_inspector_real(
            rutas_fuente=source_files,
            db=db,
            provider=(inspector_rt.provider if inspector_rt else provider_enum),
            model=(inspector_rt.model if inspector_rt else llm_model),
            temperature=(inspector_rt.temperature if inspector_rt else temperature),
            max_tokens=(inspector_rt.max_tokens if inspector_rt else max_tokens),
            timeout_seconds=(inspector_rt.timeout_seconds if inspector_rt else 120),
            api_key_override=(inspector_rt.api_key if inspector_rt else llm_api_key) or None,
            base_url_override=inspector_rt.base_url if inspector_rt else llm_base_url,
            usage_out=inspector_usage,
        )
        inspector_status = "success"
        inspector_error = None
    except Exception as e:
        logger.error(
            "scr.pipeline.inspector_error",
            extra={"review_id": str(review_id), "error": str(e)[:200]},
        )
        inspector_out = await run_inspector_stub(rutas_fuente=source_files)
        inspector_status = "fallback"
        inspector_error = str(e)[:500]
        if inspector_rt or llm_rt:
            await _notify_scr_progress(
                review.id,
                35,
                "Inspector",
                f"Inspector LLM falló: {inspector_error[:160]}",
            )
            await _merge_durable_progress_into_session(db, review)
            fail_after_inspector_metric = True
    await record_scr_metric_durable(
        review_id=review.id,
        user_id=review.user_id,
        agent="inspector",
        started_at=inspector_started_at,
        provider=(
            inspector_usage.get("provider")
            or (inspector_rt.provider.value if inspector_rt else provider_enum.value)
        ),
        model=inspector_usage.get("model") or (inspector_rt.model if inspector_rt else llm_model),
        tokens_used=inspector_usage.get("tokens_used"),
        status=inspector_status,
        error=inspector_error,
        extra={
            "findings_detected": len(inspector_out),
            "files_analyzed": len(source_files),
            "input_tokens": inspector_usage.get("input_tokens", 0),
            "output_tokens": inspector_usage.get("output_tokens", 0),
        },
    )
    if fail_after_inspector_metric:
        raise RuntimeError(inspector_error or "Inspector LLM falló")

    merged_findings: list[CodeSecurityFinding] = []
    for row in inspector_out:
        fp = fingerprint_for_finding(review.id, row["archivo"], row["linea_inicio"], row["tipo_malicia"])
        merged_findings.append(
            CodeSecurityFinding(
                user_id=review.user_id,
                review_id=review.id,
                fingerprint=fp,
                archivo=row["archivo"],
                linea_inicio=row["linea_inicio"],
                linea_fin=row["linea_fin"],
                tipo_malicia=row["tipo_malicia"],
                severidad=row["severidad"],
                confianza=float(row["confianza"]),
                descripcion=row["descripcion"],
                codigo_snippet=row.get("codigo_snippet"),
                impacto=row.get("impacto"),
                explotabilidad=row.get("explotabilidad"),
                remediacion_sugerida=row.get("remediacion_sugerida"),
                estado="DETECTED",
            )
        )

    db.add_all(merged_findings)
    await _notify_scr_progress(
        review.id,
        52,
        "Inspector",
        f"Inspector: {len(merged_findings)} hallazgos persistidos",
    )
    await _merge_durable_progress_into_session(db, review)

    # PASO 3: Detective (real analysis with commits)
    await _notify_scr_progress(review.id, 58, "Detective", "Analizando línea temporal Git…")
    await _merge_durable_progress_into_session(db, review)
    await _raise_if_cancelled(db, review)
    detective_usage: dict[str, Any] = {}
    detective_started_at = now_utc()
    if commits:
        await run_detective_real(
            review_id=str(review.id),
            inspector_findings=inspector_out,
            commits=commits,
            db=db,
            llm=detective_rt,
            usage_out=detective_usage,
        )
        detective_status = "success"
        detective_error = None
    else:
        # Fallback to stub if no commits
        detective_out = await run_detective_stub(inspector_rows=inspector_out)
        for _idx, evt in enumerate(detective_out):
            db.add(
                CodeSecurityEvent(
                    review_id=review.id,
                    event_ts=datetime.now(UTC),
                    commit_hash=evt["commit_hash"][:64],
                    autor=evt["autor"][:512],
                    archivo=evt["archivo"][:1024],
                    accion=evt["accion"][:32],
                    mensaje_commit=evt.get("mensaje_commit"),
                    nivel_riesgo=evt["nivel_riesgo"],
                    indicadores=list(evt["indicadores"]),
                    descripcion=evt.get("descripcion"),
                )
            )
        detective_status = "fallback"
        detective_error = None
    await record_scr_metric_durable(
        review_id=review.id,
        user_id=review.user_id,
        agent="detective",
        started_at=detective_started_at,
        provider=detective_usage.get("provider") or (detective_rt.provider.value if detective_rt else None),
        model=detective_usage.get("model") or (detective_rt.model if detective_rt else None),
        tokens_used=detective_usage.get("tokens_used"),
        status=detective_status,
        error=detective_error,
        extra={
            "commits_analyzed": len(commits),
            "input_tokens": detective_usage.get("input_tokens", 0),
            "output_tokens": detective_usage.get("output_tokens", 0),
        },
    )

    await _notify_scr_progress(review.id, 78, "Fiscal", "Generando informe ejecutivo…")
    await _merge_durable_progress_into_session(db, review)
    await _raise_if_cancelled(db, review)

    # PASO 4: Fiscal (real report generation)
    fiscal_usage: dict[str, Any] = {}
    fiscal_started_at = now_utc()
    await run_fiscal_real(
        review_id=str(review.id),
        review_title=review.titulo,
        db=db,
        llm=fiscal_rt,
        usage_out=fiscal_usage,
    )
    await record_scr_metric_durable(
        review_id=review.id,
        user_id=review.user_id,
        agent="fiscal",
        started_at=fiscal_started_at,
        provider=fiscal_usage.get("provider") or (fiscal_rt.provider.value if fiscal_rt else None),
        model=fiscal_usage.get("model") or (fiscal_rt.model if fiscal_rt else None),
        tokens_used=fiscal_usage.get("tokens_used"),
        extra={
            "input_tokens": fiscal_usage.get("input_tokens", 0),
            "output_tokens": fiscal_usage.get("output_tokens", 0),
        },
    )

    # Update incremental analysis tracking
    if commits:
        h0 = commits[0].get("hash") or commits[0].get("commit_hash") or ""
        review.last_analyzed_commit = (h0 or "")[:64] or None
        review.last_analyzed_at = datetime.now(UTC)

    review.estado = "COMPLETED"
    review.completed_at = now_utc()
    review.duration_ms = duration_ms(review.started_at or review.created_at, review.completed_at)
    total_tokens, total_cost, _stage_ms = await aggregate_review_metrics(db, review.id)
    review.total_tokens_used = total_tokens
    review.estimated_cost_usd = total_cost
    review.progreso = 100
    review.agente_actual = "Fiscal"
    review.actividad = "Análisis completado"
    await db.flush()
    logger.info("scr.pipeline.complete", extra={"event": "scr.pipeline.complete", "review_id": str(review_id)})


async def _fail_review(review_id: uuid.UUID, reason: str | None = None) -> None:
    async def _mark(db: AsyncSession) -> None:
        stmt = (
            select(CodeSecurityReview)
            .where(CodeSecurityReview.id == review_id)
            .where(CodeSecurityReview.deleted_at.is_(None))
        )
        r = await db.execute(stmt)
        review = r.scalar_one_or_none()
        if review:
            review.estado = "FAILED"
            review.progreso = 0
            review.agente_actual = review.agente_actual or "Pipeline"
            review.actividad = f"Análisis falló: {(reason or 'ver logs del pipeline')[:180]}"
            review.completed_at = now_utc()
            review.duration_ms = duration_ms(review.started_at or review.created_at, review.completed_at)
            total_tokens, total_cost, _stage_ms = await aggregate_review_metrics(db, review.id)
            review.total_tokens_used = total_tokens
            review.estimated_cost_usd = total_cost
            await db.flush()

    await run_in_transaction(_mark)


async def _runner(review_id: uuid.UUID) -> None:
    try:

        async def _prep(db: AsyncSession) -> bool:
            return await _prepare_scr_session(db, review_id)

        async def _exec(db: AsyncSession) -> None:
            await _execute_scr_analysis_core(db, review_id)

        ok = await run_in_transaction(_prep)
        if not ok:
            return
        await _notify_scr_progress(review_id, 8, "Pipeline", "Iniciando análisis…")
        await run_in_transaction(_exec)
    except RuntimeError as exc:
        if str(exc) == "SCR_CANCELLED":
            logger.info(
                "scr.pipeline.cancelled",
                extra={"event": "scr.pipeline.cancelled", "review_id": str(review_id)},
            )
            return
        raise
    except Exception as exc:
        logger.exception(
            "scr.pipeline.failed",
            extra={"event": "scr.pipeline.failed", "review_id": str(review_id)},
        )
        await _fail_review(review_id, str(exc))


async def run_scr_analysis_background(review_id: uuid.UUID) -> None:
    """Invocado con ``BackgroundTasks.add_task`` al terminar el request (fase 4)."""
    await _runner(review_id)
