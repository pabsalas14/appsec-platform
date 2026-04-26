"""Custom Field service — admin-managed CRUD."""

from app.models.custom_field import CustomField, CustomFieldValue
from app.schemas.custom_field import (
    CustomFieldCreate,
    CustomFieldUpdate,
    CustomFieldValueCreate,
    CustomFieldValueUpdate,
)
from app.services.base import BaseService

custom_field_svc = BaseService[CustomField, CustomFieldCreate, CustomFieldUpdate](
    CustomField,
    audit_action_prefix="custom_field",
)

custom_field_value_svc = BaseService[CustomFieldValue, CustomFieldValueCreate, CustomFieldValueUpdate](
    CustomFieldValue,
    audit_action_prefix="custom_field_value",
)
