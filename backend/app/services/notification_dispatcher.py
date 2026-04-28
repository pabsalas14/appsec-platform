"""Notification dispatcher — sends to in-app and email channels (S18)."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.email_log import EmailLog
from app.models.notificacion import Notificacion
from app.models.user import User
from app.schemas.notificacion import NotificacionCreate
from app.services.email_service import email_service
from app.services.notificacion_service import notificacion_svc
from app.services.user_preferences_service import user_preferences_svc


class NotificationDispatcher:
    """
    Dispatch notifications to multiple channels (in-app, email).
    Respects user preferences per channel and notification type.
    """

    @staticmethod
    async def dispatch(
        db: AsyncSession,
        user_id: uuid.UUID,
        notification_type: str,
        titulo: str,
        cuerpo: str,
        email_template_nombre: str | None = None,
        email_variables: dict[str, str] | None = None,
    ) -> dict:
        """
        Send notification through enabled channels.

        Args:
            db: Database session
            user_id: Target user
            notification_type: Type of notification (sla_vencida, etc.)
            titulo: In-app notification title
            cuerpo: In-app notification body
            email_template_nombre: Email template name (optional)
            email_variables: Variables for email template

        Returns:
            {"in_app": Notificacion, "email": EmailLog or None, "channels_sent": []}
        """
        result = {"channels_sent": [], "in_app": None, "email": None}

        # Get user preferences
        prefs = await user_preferences_svc.get_preferences(db, user_id)

        # Get user email
        from sqlalchemy import select

        from app.models.user import User

        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            logger.warning(
                "notification_dispatcher.user_not_found",
                extra={"event": "notification_dispatcher.user_not_found", "user_id": str(user_id)},
            )
            return result

        # Check if notifications are globally disabled
        if prefs.get("notificaciones_automaticas") is False:
            logger.info(
                "notification_dispatcher.notifications_disabled",
                extra={
                    "event": "notification_dispatcher.notifications_disabled",
                    "user_id": str(user_id),
                },
            )
            return result

        # Send in-app notification
        try:
            in_app_notif = await NotificationDispatcher._send_in_app(
                db,
                user_id,
                titulo,
                cuerpo,
            )
            result["in_app"] = in_app_notif
            result["channels_sent"].append("in_app")
        except Exception as e:
            logger.error(
                "notification_dispatcher.in_app_failed",
                extra={
                    "event": "notification_dispatcher.in_app_failed",
                    "user_id": str(user_id),
                    "error": str(e),
                },
            )

        # Send email notification if enabled
        try:
            if (
                await user_preferences_svc.is_channel_enabled(
                    db,
                    user_id,
                    notification_type,
                    "email",
                )
                and email_template_nombre
            ):
                email_log = await NotificationDispatcher._send_email(
                    db,
                    user,
                    email_template_nombre,
                    email_variables,
                    in_app_notif.id if in_app_notif else None,
                )
                result["email"] = email_log
                result["channels_sent"].append("email")
        except Exception as e:
            logger.error(
                "notification_dispatcher.email_failed",
                extra={
                    "event": "notification_dispatcher.email_failed",
                    "user_id": str(user_id),
                    "notification_type": notification_type,
                    "error": str(e),
                },
            )

        if result["channels_sent"]:
            logger.info(
                "notification_dispatcher.dispatched",
                extra={
                    "event": "notification_dispatcher.dispatched",
                    "user_id": str(user_id),
                    "notification_type": notification_type,
                    "channels": result["channels_sent"],
                },
            )

        return result

    @staticmethod
    async def _send_in_app(
        db: AsyncSession,
        user_id: uuid.UUID,
        titulo: str,
        cuerpo: str,
    ) -> Notificacion:
        """Send in-app notification."""
        create_in = NotificacionCreate(
            titulo=titulo,
            cuerpo=cuerpo,
            leida=False,
        )
        notif = await notificacion_svc.create(db, create_in, extra={"user_id": user_id})
        return notif

    @staticmethod
    async def _send_email(
        db: AsyncSession,
        user: User,
        template_nombre: str,
        variables: dict[str, str] | None,
        notificacion_id: uuid.UUID | None = None,
    ) -> EmailLog:
        """Send email notification."""

        email_log = await email_service.send_email(
            db,
            destinatario=user.email,
            template_nombre=template_nombre,
            variables=variables or {},
            notificacion_id=notificacion_id,
            user_id=user.id,
        )
        return email_log


# Singleton instance
notification_dispatcher = NotificationDispatcher()
