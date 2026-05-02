"""Tareas Celery SCR — delegan en el pipeline real (Inspector → Detective → Fiscal)."""

from __future__ import annotations

import asyncio
from uuid import UUID

from celery_app import celery_app

from app.core.logging import logger


@celery_app.task(name="scr.run_pipeline")
def scr_run_pipeline_task(review_id: str) -> None:
    """Ejecuta el mismo pipeline asíncrono que `BackgroundTasks`, en el worker."""
    from app.orm_bootstrap import import_all_orm

    import_all_orm()
    from app.services.scr_pipeline import run_scr_analysis_background

    logger.info("scr.celery.task_start", extra={"event": "scr.celery.task_start", "review_id": review_id})
    asyncio.run(run_scr_analysis_background(UUID(review_id)))
    logger.info("scr.celery.task_done", extra={"event": "scr.celery.task_done", "review_id": review_id})
