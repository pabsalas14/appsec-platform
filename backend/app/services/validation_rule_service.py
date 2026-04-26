"""Validation Rule service — admin-managed CRUD."""

import re
from typing import Any

from app.core.exceptions import BadRequestException
from app.core.formula_engine import FormulaEngine, FormulaError
from app.models.validation_rule import ValidationRule
from app.schemas.validation_rule import ValidationRuleCreate, ValidationRuleUpdate
from app.services.base import BaseService

validation_rule_svc = BaseService[ValidationRule, ValidationRuleCreate, ValidationRuleUpdate](
    ValidationRule,
    audit_action_prefix="validation_rule",
)


async def validate_rule(rule: ValidationRule, data: dict[str, Any]) -> bool:
    """
    Validate data against a validation rule.
    
    Args:
        rule: ValidationRule instance
        data: Data dictionary to validate
        
    Returns:
        bool: True if validation passes, False otherwise
        
    Raises:
        BadRequestException: If rule execution fails
    """
    if not rule.enabled:
        return True

    condition = rule.condition
    rule_type = rule.rule_type

    if rule_type == "required":
        # Check if field exists and is not empty
        field = condition.get("field")
        if not field:
            raise BadRequestException("Required rule must specify 'field'")
        value = data.get(field)
        return value is not None and value != ""

    elif rule_type == "regex":
        # Match regex pattern
        field = condition.get("field")
        pattern = condition.get("pattern")
        if not field or not pattern:
            raise BadRequestException("Regex rule must specify 'field' and 'pattern'")
        value = data.get(field, "")
        try:
            return bool(re.match(pattern, str(value)))
        except re.error as e:
            raise BadRequestException(f"Invalid regex pattern: {str(e)}")

    elif rule_type == "conditional":
        # Check condition, then validate nested check
        field = condition.get("field")
        op = condition.get("op")  # ==, !=, <, >, <=, >=, in, contains
        expected = condition.get("value")
        then_check = condition.get("then_check")

        if not field or not op:
            raise BadRequestException("Conditional rule must specify 'field' and 'op'")

        value = data.get(field)
        condition_met = _evaluate_condition(value, op, expected)

        if condition_met and then_check:
            # Recursively validate nested condition
            nested_field = then_check.get("field")
            nested_value = data.get(nested_field)
            nested_op = then_check.get("op")
            nested_expected = then_check.get("value")
            return _evaluate_condition(nested_value, nested_op, nested_expected)

        return condition_met

    elif rule_type == "formula":
        # Execute formula and check if result is truthy
        formula_text = condition.get("formula")
        if not formula_text:
            raise BadRequestException("Formula rule must specify 'formula'")
        try:
            result = FormulaEngine.execute(formula_text, data)
            return bool(result)
        except FormulaError as e:
            raise BadRequestException(f"Formula execution failed: {str(e)}")

    else:
        raise BadRequestException(f"Unknown rule type: {rule_type}")


def _evaluate_condition(value: Any, op: str, expected: Any) -> bool:
    """Evaluate a single condition."""
    if op == "==":
        return value == expected
    elif op == "!=":
        return value != expected
    elif op == "<":
        return value < expected
    elif op == ">":
        return value > expected
    elif op == "<=":
        return value <= expected
    elif op == ">=":
        return value >= expected
    elif op == "in":
        return value in (expected if isinstance(expected, list) else [expected])
    elif op == "contains":
        return expected in str(value) if value else False
    else:
        raise BadRequestException(f"Unknown operator: {op}")
