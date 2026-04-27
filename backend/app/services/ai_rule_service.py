"""AI Rule service — admin-managed CRUD."""

from app.models.ai_rule import AIRule
from app.schemas.ai_rule import AIRuleCreate, AIRuleUpdate
from app.services.base import BaseService

ai_rule_svc = BaseService[AIRule, AIRuleCreate, AIRuleUpdate](
    AIRule,
    audit_action_prefix="ai_rule",
)
