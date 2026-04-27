"""Email template CRUD service."""

from app.models.email_template import EmailTemplate
from app.schemas.email_template import EmailTemplateCreate, EmailTemplateUpdate
from app.services.base import BaseService


class EmailTemplateService(BaseService[EmailTemplate, EmailTemplateCreate, EmailTemplateUpdate]):
    """Service for email template management."""

    pass


# Singleton instance
email_template_svc = EmailTemplateService(EmailTemplate)
