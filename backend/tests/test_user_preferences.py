"""Tests for user preferences service (S18)."""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.user_preferences_service import user_preferences_svc


@pytest.fixture
async def test_user(db: AsyncSession) -> User:
    """Create test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        role="user",
        preferences=None,
    )
    db.add(user)
    await db.flush()
    return user


@pytest.mark.asyncio
async def test_get_default_preferences(db: AsyncSession, test_user: User):
    """Test getting default preferences for new user."""
    prefs = await user_preferences_svc.get_preferences(db, test_user.id)

    assert prefs["notificaciones_automaticas"] is True
    assert "email_notificaciones" in prefs
    assert prefs["email_notificaciones"]["_global"] is False
    assert prefs["digest_type"] == "immediato"


@pytest.mark.asyncio
async def test_set_preferences(db: AsyncSession, test_user: User):
    """Test updating user preferences."""
    new_prefs = {
        "digest_type": "diario",
        "digest_hour_utc": 14,
    }

    updated = await user_preferences_svc.set_preferences(db, test_user.id, new_prefs)

    assert updated["digest_type"] == "diario"
    assert updated["digest_hour_utc"] == 14
    assert updated["notificaciones_automaticas"] is True  # Preserved


@pytest.mark.asyncio
async def test_enable_email_all_types(db: AsyncSession, test_user: User):
    """Test enabling email for all notification types."""
    updated = await user_preferences_svc.enable_email_channel(
        db,
        test_user.id,
        all_types=True,
    )

    email_prefs = updated["email_notificaciones"]
    assert email_prefs["sla_vencida"] is True
    assert email_prefs["vulnerabilidad_critica"] is True


@pytest.mark.asyncio
async def test_enable_email_specific_types(db: AsyncSession, test_user: User):
    """Test enabling email for specific types."""
    updated = await user_preferences_svc.enable_email_channel(
        db,
        test_user.id,
        notification_types=["sla_vencida", "vulnerabilidad_critica"],
    )

    email_prefs = updated["email_notificaciones"]
    assert email_prefs["sla_vencida"] is True
    assert email_prefs["vulnerabilidad_critica"] is True


@pytest.mark.asyncio
async def test_disable_email_channel(db: AsyncSession, test_user: User):
    """Test disabling email notifications."""
    # First enable
    await user_preferences_svc.enable_email_channel(db, test_user.id, all_types=True)

    # Then disable specific type
    updated = await user_preferences_svc.disable_email_channel(
        db,
        test_user.id,
        notification_types=["sla_vencida"],
    )

    email_prefs = updated["email_notificaciones"]
    assert email_prefs["sla_vencida"] is False
    assert email_prefs["vulnerabilidad_critica"] is True


@pytest.mark.asyncio
async def test_is_channel_enabled_in_app(db: AsyncSession, test_user: User):
    """Test checking if in-app channel is enabled."""
    # In-app should be enabled by default
    is_enabled = await user_preferences_svc.is_channel_enabled(
        db,
        test_user.id,
        "sla_vencida",
        "in_app",
    )
    assert is_enabled is True


@pytest.mark.asyncio
async def test_is_channel_enabled_email(db: AsyncSession, test_user: User):
    """Test checking if email channel is enabled."""
    # Email disabled by default
    is_enabled = await user_preferences_svc.is_channel_enabled(
        db,
        test_user.id,
        "sla_vencida",
        "email",
    )
    assert is_enabled is False

    # Enable and recheck
    await user_preferences_svc.enable_email_channel(
        db,
        test_user.id,
        notification_types=["sla_vencida"],
    )

    is_enabled = await user_preferences_svc.is_channel_enabled(
        db,
        test_user.id,
        "sla_vencida",
        "email",
    )
    assert is_enabled is True


@pytest.mark.asyncio
async def test_global_disable(db: AsyncSession, test_user: User):
    """Test global notifications disable."""
    await user_preferences_svc.set_preferences(
        db,
        test_user.id,
        {"notificaciones_automaticas": False},
    )

    # Both channels should be disabled
    in_app = await user_preferences_svc.is_channel_enabled(
        db,
        test_user.id,
        "sla_vencida",
        "in_app",
    )
    email = await user_preferences_svc.is_channel_enabled(
        db,
        test_user.id,
        "sla_vencida",
        "email",
    )

    assert in_app is False
    assert email is False
