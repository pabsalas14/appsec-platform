"""Initialize email notification system on app startup."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.services.email_template_seed import seed_email_templates


async def init_email_notifications(db: AsyncSession) -> None:
    """
    Initialize email notification system.
    Called from app startup hooks.
    """
    try:
        logger.info(
            "email_notifications.init_start",
            extra={"event": "email_notifications.init_start"},
        )

        # Seed email templates
        await seed_email_templates(db)
        await db.commit()

        logger.info(
            "email_notifications.init_complete",
            extra={"event": "email_notifications.init_complete"},
        )
    except Exception as e:
        logger.error(
            "email_notifications.init_failed",
            extra={
                "event": "email_notifications.init_failed",
                "error": str(e),
            },
        )
        raise
