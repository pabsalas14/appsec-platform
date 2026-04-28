"""Celery async tasks for email notifications (S18)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.core.logging import logger
from app.models.email_log import EmailLog
from app.services.email_service import email_service

# Celery configuration would go here in a real setup
# For now, we provide async/sync wrappers


class CeleryTasksManager:
    """Manager for async email tasks."""

    @staticmethod
    async def send_email_async(
        email_log_id: str,
    ) -> dict:
        """
        Async task: send email by email_log_id.
        Called from a Celery task or APScheduler job.
        """
        # Create async DB session
        engine = create_async_engine(settings.DATABASE_URL)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with async_session() as db:
            try:
                result = await db.execute(
                    select(EmailLog).where(EmailLog.id == uuid.UUID(email_log_id))
                )
                email_log = result.scalar_one_or_none()

                if not email_log:
                    logger.warning(
                        "celery_tasks.email_log_not_found",
                        extra={"event": "celery_tasks.email_log_not_found", "email_log_id": email_log_id},
                    )
                    return {"success": False, "error": "EmailLog not found"}

                # Attempt to send
                try:
                    await email_service._send_smtp(
                        email_log.destinatario,
                        email_log.asunto,
                        email_log.email_template_id,  # Should be reconstructed from template
                        email_log,
                    )
                    await db.commit()
                    logger.info(
                        "celery_tasks.email_sent",
                        extra={
                            "event": "celery_tasks.email_sent",
                            "email_log_id": email_log_id,
                        },
                    )
                    return {"success": True, "email_log_id": email_log_id}
                except Exception as e:
                    email_log.reintentos += 1
                    email_log.ultimo_intento_at = datetime.now(UTC)

                    if email_log.reintentos >= settings.EMAIL_MAX_RETRIES:
                        email_log.estado = "fallido"
                    else:
                        email_log.estado = "pendiente"

                    email_log.error_mensaje = str(e)
                    await db.commit()

                    logger.warning(
                        "celery_tasks.email_send_failed",
                        extra={
                            "event": "celery_tasks.email_send_failed",
                            "email_log_id": email_log_id,
                            "reintentos": email_log.reintentos,
                            "error": str(e),
                        },
                    )
                    return {
                        "success": False,
                        "email_log_id": email_log_id,
                        "reintentos": email_log.reintentos,
                        "error": str(e),
                    }

            finally:
                await engine.dispose()

    @staticmethod
    async def retry_pending_emails() -> dict:
        """
        Async task: retry all pending/failed emails.
        Called periodically (hourly) from APScheduler.
        """
        engine = create_async_engine(settings.DATABASE_URL)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        try:
            async with async_session() as db:
                result = await email_service.retry_failed_emails(db)
                await db.commit()
                return result
        finally:
            await engine.dispose()

    @staticmethod
    async def cleanup_old_email_logs(days_to_keep: int = 90) -> dict:
        """
        Async task: delete old email logs for compliance (optional).
        """
        engine = create_async_engine(settings.DATABASE_URL)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        try:
            async with async_session() as db:
                cutoff = datetime.now(UTC).replace(day=1) - timedelta(days=days_to_keep)
                result = await db.execute(
                    select(EmailLog).where(EmailLog.created_at < cutoff)
                )
                logs = result.scalars().all()
                deleted = 0

                for log in logs:
                    await db.delete(log)
                    deleted += 1

                if deleted > 0:
                    await db.commit()
                    logger.info(
                        "celery_tasks.email_logs_cleanup",
                        extra={
                            "event": "celery_tasks.email_logs_cleanup",
                            "deleted": deleted,
                        },
                    )

                return {"deleted": deleted}
        finally:
            await engine.dispose()


# Singleton manager
celery_tasks_mgr = CeleryTasksManager()
