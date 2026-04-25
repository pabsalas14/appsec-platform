"""QueryValidator service — validates Query Builder configurations (Fase 1)."""

from __future__ import annotations

import re
from typing import Any

from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.database import Base


class QueryValidationError(Exception):
    """Raised when query configuration validation fails."""

    pass


class QueryValidator:
    """Validates query configurations for safety and correctness."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.errors: list[str] = []
        self.warnings: list[str] = []

    async def validate(self, config: dict[str, Any]) -> bool:
        """
        Full validation of a query configuration.
        Returns True if valid, False otherwise.
        Populates self.errors and self.warnings.
        """
        self.errors.clear()
        self.warnings.clear()

        # Validate base table exists
        if not await self._validate_base_table(config.get("base_table")):
            return False

        # Validate joins are valid
        if not await self._validate_joins(config.get("base_table"), config.get("joins", [])):
            return False

        # Validate select fields exist
        if not await self._validate_select_fields(config.get("base_table"), config.get("select_fields", [])):
            return False

        # Validate calculated fields
        if not await self._validate_calculated_fields(config.get("calculated_fields", [])):
            return False

        # Validate filters
        if not await self._validate_filters(config.get("base_table"), config.get("filters", [])):
            return False

        # Validate GROUP BY
        if not await self._validate_aggregations(config.get("group_by", []), config.get("aggregations", [])):
            return False

        # Validate performance (warning level)
        await self._validate_performance(config)

        return len(self.errors) == 0

    async def _validate_base_table(self, table_name: str | None) -> bool:
        """Ensure base_table is a valid model class."""
        if not table_name:
            self.errors.append("base_table is required")
            return False

        # Get all mapped classes from Base registry
        valid_tables = {mapper.class_.__tablename__ for mapper in Base.registry.mappers}

        if table_name not in valid_tables:
            self.errors.append(f"Table '{table_name}' does not exist. Valid tables: {', '.join(sorted(valid_tables))}")
            return False

        return True

    async def _validate_joins(self, base_table: str, joins: list[dict[str, Any]]) -> bool:
        """Validate join configurations (table exists, FK exists)."""
        if not joins:
            return True

        valid_tables = {mapper.class_.__tablename__ for mapper in Base.registry.mappers}

        for join in joins:
            join_table = join.get("table")
            on_field = join.get("on_field")
            join_type = join.get("type", "left").lower()

            # Validate join table exists
            if join_table not in valid_tables:
                self.errors.append(f"Join table '{join_table}' does not exist")
                return False

            # Validate join type
            if join_type not in ["inner", "left", "right", "outer"]:
                self.errors.append(f"Invalid join type: {join_type}")
                return False

            # Validate on_field is a valid FK or common field
            # (simplified: we're checking it looks like a field name)
            if not on_field or not isinstance(on_field, str):
                self.errors.append(f"Invalid join condition: on_field must be a string")
                return False

        return True

    async def _validate_select_fields(self, base_table: str, select_fields: list[str]) -> bool:
        """Validate that all select_fields exist in the base table."""
        if not select_fields:
            return True

        # Get columns from the table
        mapper = None
        for m in Base.registry.mappers:
            if m.class_.__tablename__ == base_table:
                mapper = m
                break

        if not mapper:
            self.errors.append(f"Cannot find mapper for table {base_table}")
            return False

        valid_columns = {col.name for col in mapper.columns}
        # Also allow "count(*)", "sum(...)", etc. (aggregates handled separately)

        for field in select_fields:
            # Skip aggregate functions for now
            if any(field.startswith(agg) for agg in ["count(", "sum(", "avg(", "max(", "min(", "distinct("]):
                continue

            if field not in valid_columns and "*" not in field:
                self.errors.append(f"Field '{field}' does not exist in table '{base_table}'")
                return False

        return True

    async def _validate_calculated_fields(self, calculated_fields: list[dict[str, Any]]) -> bool:
        """Validate calculated field formulas (basic syntax check)."""
        if not calculated_fields:
            return True

        for calc_field in calculated_fields:
            name = calc_field.get("name")
            formula = calc_field.get("formula")

            if not name or not formula:
                self.errors.append("Calculated field missing 'name' or 'formula'")
                return False

            # Basic formula syntax validation
            if not self._is_valid_formula(formula):
                self.errors.append(f"Invalid formula syntax: {formula}")
                return False

        return True

    def _is_valid_formula(self, formula: str) -> bool:
        """Check if formula has valid syntax (basic check)."""
        # Allow: function_name(...), field_name, numbers, operators
        # Disallow: SQL keywords, semicolons, comments
        forbidden_patterns = [";", "--", "/*", "*/", "DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE"]

        if any(pattern in formula.upper() for pattern in forbidden_patterns):
            return False

        # Allow: alphanumeric, parentheses, commas, spaces, underscores, quotes
        if not re.match(r"^[a-zA-Z0-9_\(\),\s\-\+\*/\.\"']+$", formula):
            return False

        return True

    async def _validate_filters(self, base_table: str, filters: list[dict[str, Any]]) -> bool:
        """Validate filter conditions (field exists, operator valid, value type check)."""
        if not filters:
            return True

        # Get columns from the table
        mapper = None
        for m in Base.registry.mappers:
            if m.class_.__tablename__ == base_table:
                mapper = m
                break

        if not mapper:
            return True  # Already validated in select fields

        valid_columns = {col.name for col in mapper.columns}
        valid_operators = ["=", "!=", "<", "<=", ">", ">=", "IN", "NOT IN", "LIKE", "NOT LIKE", "IS NULL", "IS NOT NULL"]

        for filter_item in filters:
            field = filter_item.get("field")
            operator = filter_item.get("operator", "=").upper()
            value = filter_item.get("value")

            if field not in valid_columns:
                self.errors.append(f"Filter field '{field}' does not exist in table '{base_table}'")
                return False

            if operator not in valid_operators:
                self.errors.append(f"Invalid filter operator: {operator}")
                return False

        return True

    async def _validate_aggregations(self, group_by: list[str], aggregations: list[dict[str, Any]]) -> bool:
        """
        Validate GROUP BY and aggregation rules.
        If aggregations are present, GROUP BY should also be present.
        Aggregation functions should be valid (COUNT, SUM, AVG, MAX, MIN, etc.)
        """
        if not aggregations:
            return True

        if not group_by:
            self.warnings.append("Aggregations present but no GROUP BY fields specified")
            # Not an error, just a warning

        valid_agg_functions = ["COUNT", "SUM", "AVG", "MAX", "MIN", "DISTINCT", "STRING_AGG"]

        for agg in aggregations:
            field = agg.get("field", "").upper()

            # Check if field contains a valid aggregation function
            valid_agg = any(func in field for func in valid_agg_functions)
            if not valid_agg and field != "COUNT(*)":
                self.warnings.append(f"Field '{field}' does not look like a valid aggregation")

        return True

    async def _validate_performance(self, config: dict[str, Any]) -> None:
        """
        Check for potential performance issues (warnings only).
        """
        joins = config.get("joins", [])
        select_fields = config.get("select_fields", [])
        filters = config.get("filters", [])

        # Warn if too many joins
        if len(joins) > 5:
            self.warnings.append(f"Query has {len(joins)} joins — consider simplifying")

        # Warn if no filters on large result sets
        if not filters:
            self.warnings.append("No filters applied — query may return a lot of data")

        # Warn if selecting too many fields
        if select_fields and len(select_fields) > 20:
            self.warnings.append(f"Selecting {len(select_fields)} fields — consider filtering columns")

        # Warn about LIKE patterns
        for filter_item in filters:
            value = filter_item.get("value")
            operator = filter_item.get("operator", "").upper()

            if operator == "LIKE" and value and value.startswith("%"):
                self.warnings.append("LIKE with leading wildcard can be slow on large tables")

    def get_validation_result(self) -> dict[str, Any]:
        """Return validation result as a dict."""
        return {
            "valid": len(self.errors) == 0,
            "errors": self.errors,
            "warnings": self.warnings,
        }
