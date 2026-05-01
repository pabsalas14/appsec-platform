"""Pipeline asíncrono de análisis SCR (fases 4–6)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.database import run_in_transaction
from app.models.code_security_event import CodeSecurityEvent
from app.models.code_security_finding import CodeSecurityFinding
from app.models.code_security_report import CodeSecurityReport
from app.models.code_security_review import CodeSecurityReview
from app.services.scr_agents import fingerprint_for_finding, run_detective_stub, run_fiscal_stub
from app.services.scr_agents.scr_detective_agent import run_detective_agent, run_detective_real
from app.services.scr_agents.scr_fiscal_agent import run_fiscal_real
from app.services.scr_inspector_agent import run_inspector_stub


async def execute_scr_analysis(db: AsyncSession, review_id: uuid.UUID) -> None:
    """Ejecuta análisis real: Inspector → Detective → Fiscal usando Git real + LLM stub (por ahora)."""
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

    # Limpiar resultados previos
    await db.execute(delete(CodeSecurityEvent).where(CodeSecurityEvent.review_id == review_id))
    await db.execute(delete(CodeSecurityReport).where(CodeSecurityReport.review_id == review_id))
    await db.execute(delete(CodeSecurityFinding).where(CodeSecurityFinding.review_id == review_id))
    await db.flush()

    review.estado = "ANALYZING"
    review.progreso = 10
    await db.flush()

    # VALIDACIÓN: Verificar que el proveedor LLM está disponible
    try:
        from app.services.ia_provider import AIProviderType, get_ai_provider

        provider_name = review.scr_config.get("llm_provider", "anthropic") if review.scr_config else "anthropic"
        try:
            provider_enum = AIProviderType(provider_name)
        except ValueError:
            raise ValueError(f"Proveedor LLM inválido: {provider_name}")

        provider_obj = get_ai_provider(provider_enum)
        is_healthy = await provider_obj.health_check()

        if not is_healthy:
            review.estado = "FAILED"
            review.progreso = 0
            await db.flush()
            logger.error(
                "scr.pipeline.provider_unavailable",
                extra={
                    "review_id": str(review_id),
                    "provider": provider_name,
                    "error": f"Proveedor LLM '{provider_name}' no disponible o sin configuración"
                },
            )
            raise ValueError(f"Proveedor LLM '{provider_name}' no disponible. Verifica configuración y API keys.")

    except Exception as e:
        review.estado = "FAILED"
        review.progreso = 0
        await db.flush()
        logger.error(
            "scr.pipeline.provider_check_error",
            extra={"review_id": str(review_id), "error": str(e)[:200]},
        )
        raise

    # PASO 1: Obtener código del repo (Git real)
    try:
        from app.services.scr_github_client import clone_and_read_repo, get_commits

        if not review.url_repositorio:
            raise ValueError("URL del repositorio no configurada")

        logger.info(
            "scr.pipeline.cloning",
            extra={"review_id": str(review_id), "url": review.url_repositorio, "branch": review.rama_analizar},
        )

        # Clone and get files
        source_files = await clone_and_read_repo(review.url_repositorio, review.rama_analizar or "main")
        if not source_files:
            logger.warning(
                "scr.pipeline.no_files",
                extra={"review_id": str(review_id), "url": review.url_repositorio},
            )
            source_files = {"_empty": "# No hay archivos de código"}

        review.progreso = 30
        await db.flush()

        # Get commits for Detective
        try:
            commits = await get_commits(review.url_repositorio, review.rama_analizar or "main", limit=50)

            # Incremental Analysis: Filter out already analyzed commits
            if review.last_analyzed_commit and commits:
                new_commits = [c for c in commits if c.get("hash") != review.last_analyzed_commit]
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
        # Fallback a stub
        source_files = {"_error": f"# Git error: {str(e)[:100]}"}
        commits = []

    # PASO 2: Inspector (LLM real o fallback a stub)
    try:
        from app.services.scr_inspector_agent import run_inspector_real

        inspector_out = await run_inspector_real(
            rutas_fuente=source_files,
            db=db,
        )
    except Exception as e:
        logger.error(
            "scr.pipeline.inspector_error",
            extra={"review_id": str(review_id), "error": str(e)[:200]},
        )
        inspector_out = await run_inspector_stub(rutas_fuente=source_files)

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
    review.progreso = 60
    await db.flush()

    # PASO 3: Detective (real analysis with commits)
    if commits:
        await run_detective_real(
            review_id=str(review.id),
            inspector_findings=inspector_out,
            commits=commits,
            db=db,
        )
    else:
        # Fallback to stub if no commits
        detective_out = await run_detective_stub(inspector_rows=inspector_out)
        for idx, evt in enumerate(detective_out):
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

    review.progreso = 80
    await db.flush()

    # PASO 4: Fiscal (real report generation)
    await run_fiscal_real(
        review_id=str(review.id),
        review_title=review.titulo,
        db=db,
    )

    # Update incremental analysis tracking
    if commits:
        review.last_analyzed_commit = commits[0].get("hash", "") if commits else None
        review.last_analyzed_at = datetime.now(UTC)

    review.estado = "COMPLETED"
    review.progreso = 100
    await db.flush()
    logger.info("scr.pipeline.complete", extra={"event": "scr.pipeline.complete", "review_id": str(review_id)})


async def _fail_review(review_id: uuid.UUID) -> None:
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
            await db.flush()

    await run_in_transaction(_mark)


async def _runner(review_id: uuid.UUID) -> None:
    try:

        async def _go(db: AsyncSession) -> None:
            await execute_scr_analysis(db, review_id)

        await run_in_transaction(_go)
    except Exception:
        logger.exception(
            "scr.pipeline.failed",
            extra={"event": "scr.pipeline.failed", "review_id": str(review_id)},
        )
        await _fail_review(review_id)


async def run_scr_analysis_background(review_id: uuid.UUID) -> None:
    """Invocado con ``BackgroundTasks.add_task`` al terminar el request (fase 4)."""
    await _runner(review_id)
