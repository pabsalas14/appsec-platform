"""Custom Field service — admin-managed CRUD."""

from app.models.custom_field import CustomField
from app.schemas.custom_field import CustomFieldCreate, CustomFieldUpdate
from app.services.base import BaseService

custom_field_svc = BaseService[CustomField, CustomFieldCreate, CustomFieldUpdate](
    CustomField,
    audit_action_prefix="custom_field",
)
