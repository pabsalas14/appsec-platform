"""User preferences service for notification channels (S18)."""

import uuid
from typing import ClassVar, Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.user import User


class UserPreferencesService:
    """Manage user notification preferences."""

    # Tipo de notificación
    NOTIFICATION_TYPES: ClassVar[set[str]] = {
        "sla_vencida",
        "vulnerabilidad_critica",
        "excepcion_temporal",
        "tema_emergente_actualizado",
        "iniciativa_hito_completado",
        "tema_estancado",
        "vulnerabilidad_inactiva",
    }

    # Canales disponibles
    CHANNELS: ClassVar[set[str]] = {"in_app", "email"}

    @staticmethod
    async def get_preferences(db: AsyncSession, user_id: uuid.UUID) -> dict:
        """Get user notification preferences, returning defaults if not set."""
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            return UserPreferencesService._default_preferences()

        prefs = user.preferences or {}
        # Ensure all keys exist with defaults
        defaults = UserPreferencesService._default_preferences()
        return {**defaults, **prefs}

    @staticmethod
    async def set_preferences(
        db: AsyncSession,
        user_id: uuid.UUID,
        preferences: dict,
    ) -> dict:
        """Update user notification preferences."""
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User {user_id} not found")

        # Merge against defaults to preserve required keys
        defaults = UserPreferencesService._default_preferences()
        current = user.preferences or {}
        updated = {**defaults, **current, **preferences}

        user.preferences = updated
        await db.flush()

        logger.info(
            "user_preferences.updated",
            extra={
                "event": "user_preferences.updated",
                "user_id": str(user_id),
                "preferences": updated,
            },
        )

        return {**defaults, **updated}

    @staticmethod
    async def is_channel_enabled(
        db: AsyncSession,
        user_id: uuid.UUID,
        notification_type: str,
        channel: Literal["in_app", "email"],
    ) -> bool:
        """
        Check if channel is enabled for notification_type.
        Default behavior:
        - in_app: enabled if notificaciones_automaticas != False
        - email: enabled if email notifications are globally enabled AND user has it on
        """
        prefs = await UserPreferencesService.get_preferences(db, user_id)

        # Global disable flag
        if prefs.get("notificaciones_automaticas") is False:
            return False

        # Channel-specific preference
        if channel == "in_app":
            # in_app is always on unless globally disabled
            return True
        elif channel == "email":
            # Email needs explicit opt-in
            email_prefs = prefs.get("email_notificaciones", {})
            if not isinstance(email_prefs, dict):
                return False
            # Check notification-type specific setting or fall back to global
            return email_prefs.get(notification_type, email_prefs.get("_global", False))

        return False

    @staticmethod
    def _default_preferences() -> dict:
        """Default notification preferences."""
        return {
            "notificaciones_automaticas": True,
            "email_notificaciones": {
                "_global": False,  # Email disabled by default
                "sla_vencida": False,
                "vulnerabilidad_critica": False,
                "excepcion_temporal": False,
                "tema_emergente_actualizado": False,
                "iniciativa_hito_completado": False,
                "tema_estancado": False,
                "vulnerabilidad_inactiva": False,
            },
            "digest_type": "immediato",  # immediato | diario
            "digest_hour_utc": 9,  # for diario digest
        }

    @staticmethod
    async def enable_email_channel(
        db: AsyncSession,
        user_id: uuid.UUID,
        notification_types: list[str] | None = None,
        all_types: bool = False,
    ) -> dict:
        """
        Enable email notifications for specific types or all types.
        If all_types=True, enable all notification types.
        """
        notification_types = list(UserPreferencesService.NOTIFICATION_TYPES) if all_types else notification_types or []

        email_prefs = {}
        for nt in notification_types:
            if nt in UserPreferencesService.NOTIFICATION_TYPES:
                email_prefs[nt] = True

        preferences = {
            "email_notificaciones": email_prefs,
        }

        return await UserPreferencesService.set_preferences(db, user_id, preferences)

    @staticmethod
    async def disable_email_channel(
        db: AsyncSession,
        user_id: uuid.UUID,
        notification_types: list[str] | None = None,
        all_types: bool = False,
    ) -> dict:
        """Disable email notifications for specific types or all types."""
        current = await UserPreferencesService.get_preferences(db, user_id)
        email_prefs = current.get("email_notificaciones", {})

        if all_types:
            email_prefs = dict.fromkeys(email_prefs, False)
        else:
            for nt in notification_types or []:
                if nt in email_prefs:
                    email_prefs[nt] = False

        preferences = {
            "email_notificaciones": email_prefs,
        }

        return await UserPreferencesService.set_preferences(db, user_id, preferences)


# Singleton instance
user_preferences_svc = UserPreferencesService()
