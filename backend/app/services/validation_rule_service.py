"""Validation Rule service — admin-managed CRUD."""

from app.models.validation_rule import ValidationRule
from app.schemas.validation_rule import ValidationRuleCreate, ValidationRuleUpdate
from app.services.base import BaseService

validation_rule_svc = BaseService[ValidationRule, ValidationRuleCreate, ValidationRuleUpdate](
    ValidationRule,
    audit_action_prefix="validation_rule",
)
