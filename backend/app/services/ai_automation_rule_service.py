"""AIAutomationRule service — IA automation trigger/action rules CRUD operations."""

from app.models.ai_automation_rule import AIAutomationRule
from app.schemas.ai_automation_rule import AIAutomationRuleCreate, AIAutomationRuleUpdate
from app.services.base import BaseService

ai_automation_rule_svc = BaseService[AIAutomationRule, AIAutomationRuleCreate, AIAutomationRuleUpdate](
    AIAutomationRule,
    owner_field=None,
    default_order_by="trigger_type",
    audit_action_prefix="ai_automation_rule",
)

__all__ = ["ai_automation_rule_svc"]
