"""QueryBuilderService — builds and executes dynamic queries (Fase 1)."""

from __future__ import annotations

import asyncio
from typing import Any

from sqlalchemy import and_, inspect, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import ColumnElement

from app.core.logging import logger
from app.database import Base
from app.services.query_validator import QueryValidationError, QueryValidator


class QueryBuilderService:
    """
    Builds SQLAlchemy queries from configuration dicts.
    Handles joins, filters, grouping, aggregations, and calculated fields.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.validator = QueryValidator(db)

    async def validate_query(self, config: dict[str, Any]) -> dict[str, Any]:
        """Validate a query configuration before execution."""
        await self.validator.validate(config)
        return self.validator.get_validation_result()

    async def build_query(self, config: dict[str, Any]) -> select:
        """
        Build a SQLAlchemy select() query from configuration.
        Raises QueryValidationError if config is invalid.
        """
        # Validate first
        validation = await self.validate_query(config)
        if not validation["valid"]:
            raise QueryValidationError(f"Invalid query config: {validation['errors']}")

        base_table = config.get("base_table")
        if not base_table:
            raise QueryValidationError("base_table is required")

        # Get the model class from table name
        model_class = self._get_model_class(base_table)
        if not model_class:
            raise QueryValidationError(f"Model for table {base_table} not found")

        # Start with base table
        query = select(model_class)

        # Apply joins
        joins = config.get("joins", [])
        for join_config in joins:
            query = await self._apply_join(query, model_class, join_config)

        # Apply filters
        filters = config.get("filters", [])
        if filters:
            filter_conditions = self._build_filter_conditions(model_class, filters)
            if filter_conditions:
                query = query.where(and_(*filter_conditions))

        # Apply GROUP BY (if aggregations are present)
        aggregations = config.get("aggregations", [])
        group_by = config.get("group_by", [])
        if aggregations and group_by:
            group_by_cols = [getattr(model_class, field) for field in group_by if hasattr(model_class, field)]
            if group_by_cols:
                query = query.group_by(*group_by_cols)

        # Apply ORDER BY
        order_by = config.get("order_by", [])
        if order_by:
            order_by_cols = self._build_order_by(model_class, order_by)
            if order_by_cols:
                query = query.order_by(*order_by_cols)

        # Apply LIMIT
        limit = config.get("limit", 1000)
        if limit and isinstance(limit, int):
            query = query.limit(min(limit, 10000))  # Cap at 10k

        return query

    async def execute_with_limits(
        self,
        query: select,
        timeout_seconds: int = 30,
        max_rows: int = 10000,
    ) -> dict[str, Any]:
        """
        Execute a query with timeout and row limits.
        Returns {labels: [], values: [], rows: [], meta: {count, execution_time_ms}}.
        """
        try:
            # Set statement timeout
            await self.db.execute(text(f"SET statement_timeout = {timeout_seconds * 1000}"))

            # Execute query
            result = await asyncio.wait_for(
                self.db.execute(query),
                timeout=timeout_seconds + 5,  # Small buffer above DB timeout
            )

            # Fetch results
            rows = result.scalars().all()
            row_count = len(rows)

            if row_count > max_rows:
                rows = rows[:max_rows]
                logger.warning(f"Query returned {row_count} rows, truncated to {max_rows}")

            # Convert to dicts for JSON serialization
            row_dicts = [
                {col: getattr(row, col) for col in inspect(row.__class__).columns}
                for row in rows
                if row is not None
            ]

            return {
                "rows": row_dicts,
                "labels": list(inspect(rows[0].__class__).columns.keys()) if rows else [],
                "values": row_count,
                "meta": {
                    "count": row_count,
                    "truncated": row_count > max_rows,
                },
            }

        except TimeoutError:
            return {
                "rows": [],
                "labels": [],
                "values": 0,
                "error": "Query execution timed out",
                "meta": {"count": 0},
            }
        except Exception as e:
            logger.exception(f"Query execution error: {e}")
            return {
                "rows": [],
                "labels": [],
                "values": 0,
                "error": str(e),
                "meta": {"count": 0},
            }

    # ─── Private Helper Methods ───

    def _get_model_class(self, table_name: str) -> type | None:
        """Get SQLAlchemy model class by table name."""
        for mapper in Base.registry.mappers:
            if mapper.class_.__tablename__ == table_name:
                return mapper.class_
        return None

    async def _apply_join(self, query: select, base_model: type, join_config: dict[str, Any]) -> select:
        """Add a JOIN to the query."""
        join_table = join_config.get("table")
        on_field = join_config.get("on_field")
        join_type = join_config.get("type", "left").lower()

        join_model = self._get_model_class(join_table)
        if not join_model:
            return query  # Skip invalid join

        # Construct join condition (simplified: assumes on_field is a FK)
        if hasattr(base_model, on_field):
            join_condition = getattr(base_model, on_field) == getattr(join_model, "id", None)

            if join_type == "inner":
                query = query.join(join_model, join_condition)
            elif join_type == "left":
                query = query.outerjoin(join_model, join_condition)
            elif join_type == "right":
                # SQLAlchemy: reverse the join
                query = select(base_model).outerjoin(join_model, join_condition)
            # Note: full outer join not directly supported in SQLAlchemy for all DBs

        return query

    def _build_filter_conditions(self, model: type, filters: list[dict[str, Any]]) -> list[ColumnElement]:
        """Build WHERE clause conditions from filter list."""
        conditions = []

        for filter_item in filters:
            field = filter_item.get("field")
            operator = filter_item.get("operator", "=").upper()
            value = filter_item.get("value")

            if not hasattr(model, field):
                continue

            col = getattr(model, field)

            if operator == "=":
                conditions.append(col == value)
            elif operator == "!=":
                conditions.append(col != value)
            elif operator == "<":
                conditions.append(col < value)
            elif operator == "<=":
                conditions.append(col <= value)
            elif operator == ">":
                conditions.append(col > value)
            elif operator == ">=":
                conditions.append(col >= value)
            elif operator == "IN":
                values = value if isinstance(value, list) else [value]
                conditions.append(col.in_(values))
            elif operator == "NOT IN":
                values = value if isinstance(value, list) else [value]
                conditions.append(~col.in_(values))
            elif operator == "LIKE":
                conditions.append(col.ilike(f"%{value}%"))
            elif operator == "NOT LIKE":
                conditions.append(~col.ilike(f"%{value}%"))
            elif operator == "IS NULL":
                conditions.append(col.is_(None))
            elif operator == "IS NOT NULL":
                conditions.append(col.isnot(None))

        return conditions

    def _build_order_by(self, model: type, order_by_list: list[dict[str, Any]]) -> list[ColumnElement]:
        """Build ORDER BY clause from configuration."""
        order_by_cols = []

        for order_item in order_by_list:
            field = order_item.get("field")
            direction = order_item.get("direction", "ASC").upper()

            if not hasattr(model, field):
                continue

            col = getattr(model, field)

            if direction == "DESC":
                order_by_cols.append(col.desc())
            else:
                order_by_cols.append(col.asc())

        return order_by_cols
