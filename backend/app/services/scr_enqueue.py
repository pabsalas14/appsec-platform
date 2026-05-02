"""Encolar análisis SCR: Celery + Redis si hay broker; si no, BackgroundTasks (mismo proceso)."""

from __future__ import annotations

import os
import uuid

from fastapi import BackgroundTasks

from app.core.logging import logger
from app.services.scr_pipeline import run_scr_analysis_background


def enqueue_scr_analysis(review_id: uuid.UUID, background_tasks: BackgroundTasks) -> None:
    broker = os.getenv("CELERY_BROKER_URL", "").strip()
    if broker:
        try:
            from celery_app import celery_app

            celery_app.send_task("scr.run_pipeline", args=[str(review_id)])
            logger.info(
                "scr.enqueue.celery",
                extra={"event": "scr.enqueue.celery", "review_id": str(review_id)},
            )
            return
        except Exception as e:
            logger.warning(
                "scr.enqueue.celery_fallback",
                extra={"event": "scr.enqueue.celery_fallback", "error": str(e)[:200]},
            )
    background_tasks.add_task(run_scr_analysis_background, review_id)
