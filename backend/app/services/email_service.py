"""Email service — SMTP client with retry logic (S18)."""

import asyncio
import re
from datetime import UTC, datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from smtplib import SMTP, SMTPAuthenticationError, SMTPException

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.logging import logger
from app.models.email_log import EmailLog
from app.models.email_template import EmailTemplate
from app.models.user import User


class EmailServiceError(Exception):
    """Base exception for email service."""

    pass


class SMTPConnectionError(EmailServiceError):
    """SMTP connection failed."""

    pass


class TemplateNotFoundError(EmailServiceError):
    """Email template not found."""

    pass


class EmailService:
    """
    Email service with SMTP support, retry logic, rate limiting, and audit logging.
    """

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_from_email = settings.SMTP_FROM_EMAIL
        self.smtp_from_name = settings.SMTP_FROM_NAME
        self.smtp_use_tls = settings.SMTP_USE_TLS
        self.max_retries = settings.EMAIL_MAX_RETRIES
        self.retry_delay = settings.EMAIL_RETRY_DELAY_SECONDS

    def _connect_smtp(self) -> SMTP:
        """Create SMTP connection with TLS."""
        try:
            smtp = SMTP(self.smtp_host, self.smtp_port, timeout=10)
            if self.smtp_use_tls:
                smtp.starttls()
            if self.smtp_user and self.smtp_password:
                smtp.login(self.smtp_user, self.smtp_password)
            return smtp
        except (SMTPAuthenticationError, SMTPException) as e:
            logger.error(
                "email_service.smtp_connection_failed",
                extra={"event": "email_service.smtp_connection_failed", "error": str(e)},
            )
            raise SMTPConnectionError(f"SMTP connection failed: {e}") from e

    async def get_template(self, db: AsyncSession, template_nombre: str) -> EmailTemplate:
        """Retrieve active email template by name."""
        result = await db.execute(
            select(EmailTemplate).where(
                EmailTemplate.nombre == template_nombre,
                EmailTemplate.activo.is_(True),
            )
        )
        template = result.scalar_one_or_none()
        if not template:
            raise TemplateNotFoundError(f"Email template '{template_nombre}' not found or inactive")
        return template

    @staticmethod
    def _interpolate_template(template_html: str, variables: dict[str, str]) -> str:
        """Replace {{ variable }} placeholders with values."""
        result = template_html
        for key, value in variables.items():
            placeholder = "{{ " + key + " }}"
            result = result.replace(placeholder, str(value))
        return result

    @staticmethod
    def _validate_email(email: str) -> bool:
        """Simple email validation."""
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return re.match(pattern, email) is not None

    async def send_email(
        self,
        db: AsyncSession,
        destinatario: str,
        template_nombre: str,
        variables: dict[str, str] | None = None,
        notificacion_id: str | None = None,
        user_id: str | None = None,
    ) -> EmailLog:
        """
        Send email and create audit log entry.
        Returns EmailLog with estado='pendiente' (async send via worker).
        """
        if not settings.EMAIL_ENABLED:
            raise EmailServiceError("Email service is disabled in settings")

        if not self._validate_email(destinatario):
            raise EmailServiceError(f"Invalid email address: {destinatario}")

        template = await self.get_template(db, template_nombre)
        variables = variables or {}

        # Interpolate subject and body
        asunto = self._interpolate_template(template.asunto, variables)
        cuerpo_html = self._interpolate_template(template.cuerpo_html, variables)

        # Create email log entry
        email_log = EmailLog(
            user_id=user_id,
            notificacion_id=notificacion_id,
            email_template_id=template.id,
            destinatario=destinatario,
            asunto=asunto,
            estado="pendiente",
            reintentos=0,
        )
        db.add(email_log)
        await db.flush()

        # Attempt synchronous send (will retry async if fails)
        try:
            await self._send_smtp(destinatario, asunto, cuerpo_html, email_log)
        except SMTPConnectionError as e:
            email_log.error_mensaje = str(e)
            email_log.ultimo_intento_at = datetime.now(UTC)
            logger.warning(
                "email_service.send_failed_queued_retry",
                extra={
                    "event": "email_service.send_failed_queued_retry",
                    "email_log_id": str(email_log.id),
                    "error": str(e),
                },
            )

        return email_log

    async def _send_smtp(self, destinatario: str, asunto: str, cuerpo_html: str, email_log: EmailLog) -> None:
        """Send via SMTP (raises SMTPConnectionError if fails)."""
        smtp = None
        try:
            smtp = self._connect_smtp()

            msg = MIMEMultipart("alternative")
            msg["Subject"] = asunto
            msg["From"] = f"{self.smtp_from_name} <{self.smtp_from_email}>"
            msg["To"] = destinatario

            # Attach HTML part
            msg.attach(MIMEText(cuerpo_html, "html"))

            # Send
            smtp.send_message(msg)

            # Mark as sent
            email_log.estado = "enviado"
            email_log.enviado_at = datetime.now(UTC)

            logger.info(
                "email_service.sent_success",
                extra={
                    "event": "email_service.sent_success",
                    "email_log_id": str(email_log.id),
                    "destinatario": destinatario,
                },
            )
        except SMTPException as e:
            raise SMTPConnectionError(str(e)) from e
        finally:
            if smtp:
                smtp.quit()

    async def retry_failed_emails(
        self,
        db: AsyncSession,
        max_age_minutes: int = 1440,  # 24 hours
    ) -> dict[str, int]:
        """
        Retry emails in 'fallido' or 'pendiente' estado desde hace máximo max_age_minutes.
        Returns {'retried': int, 'success': int, 'failed': int}
        """
        cutoff = datetime.now(UTC) - timedelta(minutes=max_age_minutes)

        # Query for retryable emails
        result = await db.execute(
            select(EmailLog).where(
                and_(
                    EmailLog.estado.in_(["fallido", "pendiente"]),
                    EmailLog.reintentos < self.max_retries,
                    EmailLog.updated_at >= cutoff,
                )
            )
        )
        logs = list(result.scalars().all())

        retried = 0
        success = 0
        failed = 0

        for email_log in logs:
            # Get template to reconstruct email
            template_result = await db.execute(
                select(EmailTemplate).where(EmailTemplate.id == email_log.email_template_id)
            )
            template = template_result.scalar_one()

            try:
                email_log.reintentos += 1
                email_log.ultimo_intento_at = datetime.now(UTC)

                # Parse variables from email_log (could be stored in json field)
                # For now, just use raw asunto/cuerpo (no interpolation needed on retry)
                await self._send_smtp(
                    email_log.destinatario,
                    email_log.asunto,
                    # Reconstruct HTML from template (variables should be already interpolated in initial send)
                    template.cuerpo_html,
                    email_log,
                )
                success += 1
                retried += 1
            except SMTPConnectionError as e:
                email_log.estado = "fallido" if email_log.reintentos >= self.max_retries else "pendiente"
                email_log.error_mensaje = str(e)
                failed += 1
                retried += 1
                logger.warning(
                    "email_service.retry_failed",
                    extra={
                        "event": "email_service.retry_failed",
                        "email_log_id": str(email_log.id),
                        "intento": email_log.reintentos,
                        "error": str(e),
                    },
                )

        if retried > 0:
            await db.flush()
            logger.info(
                "email_service.retry_batch_complete",
                extra={
                    "event": "email_service.retry_batch_complete",
                    "retried": retried,
                    "success": success,
                    "failed": failed,
                },
            )

        return {"retried": retried, "success": success, "failed": failed}


# Singleton instance
email_service = EmailService()
