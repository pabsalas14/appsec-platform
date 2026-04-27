"""Tests for email service (S18)."""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_template import EmailTemplate
from app.services.email_service import (
    EmailServiceError,
    SMTPConnectionError,
    TemplateNotFoundError,
    email_service,
)


@pytest.fixture
async def email_template(db: AsyncSession) -> EmailTemplate:
    """Create test email template."""
    template = EmailTemplate(
        nombre="test_template",
        asunto="Test Subject: {{ titulo }}",
        cuerpo_html="<p>Test body: {{ descripcion }}</p>",
        variables=["titulo", "descripcion"],
        activo=True,
    )
    db.add(template)
    await db.flush()
    return template


@pytest.mark.asyncio
async def test_interpolate_template():
    """Test template variable interpolation."""
    template_html = "<p>{{ titulo }}: {{ descripcion }}</p>"
    variables = {"titulo": "Alerta", "descripcion": "Test"}

    result = email_service._interpolate_template(template_html, variables)
    assert result == "<p>Alerta: Test</p>"


@pytest.mark.asyncio
async def test_validate_email():
    """Test email validation."""
    assert email_service._validate_email("test@example.com")
    assert email_service._validate_email("user.name+tag@example.co.uk")
    assert not email_service._validate_email("invalid-email")
    assert not email_service._validate_email("@example.com")


@pytest.mark.asyncio
async def test_get_template_found(db: AsyncSession, email_template: EmailTemplate):
    """Test retrieving existing template."""
    template = await email_service.get_template(db, "test_template")
    assert template.id == email_template.id
    assert template.nombre == "test_template"


@pytest.mark.asyncio
async def test_get_template_not_found(db: AsyncSession):
    """Test retrieving non-existent template."""
    with pytest.raises(TemplateNotFoundError):
        await email_service.get_template(db, "non_existent")


@pytest.mark.asyncio
async def test_send_email_creates_log(db: AsyncSession, email_template: EmailTemplate):
    """Test sending email creates audit log."""
    with patch.object(email_service, "_send_smtp", new_callable=AsyncMock):
        email_log = await email_service.send_email(
            db,
            destinatario="test@example.com",
            template_nombre="test_template",
            variables={"titulo": "Alert", "descripcion": "Test body"},
            user_id=uuid.uuid4(),
        )

        assert email_log.destinatario == "test@example.com"
        assert email_log.asunto == "Test Subject: Alert"
        assert email_log.estado in ["enviado", "pendiente"]
        assert email_log.email_template_id == email_template.id


@pytest.mark.asyncio
async def test_send_email_invalid_email(db: AsyncSession, email_template: EmailTemplate):
    """Test sending to invalid email address."""
    with pytest.raises(EmailServiceError, match="Invalid email"):
        await email_service.send_email(
            db,
            destinatario="invalid-email",
            template_nombre="test_template",
            variables={},
        )


@pytest.mark.asyncio
async def test_retry_failed_emails(db: AsyncSession, email_template: EmailTemplate):
    """Test retry mechanism for failed emails."""
    from app.models.email_log import EmailLog

    # Create a failed email log
    email_log = EmailLog(
        user_id=uuid.uuid4(),
        email_template_id=email_template.id,
        destinatario="test@example.com",
        asunto="Test",
        estado="fallido",
        reintentos=1,
        error_mensaje="SMTP connection failed",
    )
    db.add(email_log)
    await db.flush()

    with patch.object(email_service, "_send_smtp", new_callable=AsyncMock):
        result = await email_service.retry_failed_emails(db)

        assert result["retried"] >= 0
        assert "success" in result
        assert "failed" in result
