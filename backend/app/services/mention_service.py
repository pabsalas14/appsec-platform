"""@mention detection and notification service for bitácora entries.

Parses @username tokens from text and creates in-app notifications for
mentioned users. Designed to be called after any bitácora/comment creation.
"""

from __future__ import annotations

import re
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.notificacion import Notificacion
from app.models.user import User

# Regex: @username where username is alphanumeric + dots/underscores/hyphens
_MENTION_RE = re.compile(r"@([\w.\-]+)", re.UNICODE)

# Maximum mentions processed per text to prevent abuse
_MAX_MENTIONS = 20


def extract_mentions(text: str) -> list[str]:
    """Return list of unique usernames mentioned via @handle in *text*."""
    if not text:
        return []
    found = _MENTION_RE.findall(text)
    seen: dict[str, None] = {}
    for name in found[:_MAX_MENTIONS]:
        seen[name.lower()] = None
    return list(seen.keys())


async def resolve_mentions(db: AsyncSession, usernames: list[str]) -> list[User]:
    """Resolve @usernames to User objects (case-insensitive email/username lookup)."""
    if not usernames:
        return []

    # Users may log in with email; try matching on email local part or full email
    result = await db.execute(
        select(User).where(
            User.deleted_at.is_(None),
        )
    )
    all_users: list[User] = list(result.scalars().all())

    matched: list[User] = []
    lower_names = set(usernames)
    for user in all_users:
        email_local = (user.email or "").split("@")[0].lower()
        full_email = (user.email or "").lower()
        nombre = (user.nombre or "").lower().replace(" ", ".")
        if email_local in lower_names or full_email in lower_names or nombre in lower_names:
            matched.append(user)

    return matched


async def notify_mentions(
    db: AsyncSession,
    *,
    text: str,
    author_id: uuid.UUID,
    context_title: str,
    context_url: str | None = None,
    entity_type: str = "bitacora",
    entity_id: uuid.UUID | None = None,
) -> list[uuid.UUID]:
    """Parse mentions in *text* and create Notificacion records for each mentioned user.

    Args:
        db: Async SQLAlchemy session (caller must commit).
        text: Comment/update text that may contain @mentions.
        author_id: UUID of the user who wrote the text (skip self-mentions).
        context_title: Human-readable context shown in the notification title.
        context_url: Optional deep-link URL for the frontend.
        entity_type: Entity kind (e.g. 'bitacora', 'actualizacion_tema').
        entity_id: Optional entity UUID for audit trail.

    Returns:
        List of user UUIDs that were notified.
    """
    usernames = extract_mentions(text)
    if not usernames:
        return []

    users = await resolve_mentions(db, usernames)
    notified: list[uuid.UUID] = []

    for user in users:
        if user.id == author_id:
            continue  # skip self-mentions

        cuerpo = f"Te mencionaron en: {context_title}"
        if context_url:
            cuerpo += f"\n{context_url}"

        notif = Notificacion(
            user_id=user.id,
            titulo="Mención en bitácora",
            cuerpo=cuerpo,
        )
        db.add(notif)
        notified.append(user.id)
        logger.info(
            "mention.notified",
            extra={
                "event": "mention.notified",
                "mentioned_user_id": str(user.id),
                "author_id": str(author_id),
                "entity_type": entity_type,
                "entity_id": str(entity_id) if entity_id else None,
            },
        )

    return notified
