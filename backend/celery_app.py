"""Celery app configuration for async tasks."""

from celery import Celery
import os

# Create Celery app
celery_app = Celery(
    "appsec-platform",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
)

# Register SCR worker task (real pipeline)
celery_app.autodiscover_tasks(["app.services"])
import app.services.scr_celery_tasks  # noqa: E402, F401 — side effect: task registration
