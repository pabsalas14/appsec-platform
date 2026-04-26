"""Add Module View, Custom Fields, Validation Rules, Catalogs, Navigation, AI Rules (Fases 3-8)

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-25 18:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create module_views table (FASE 3)
    op.create_table(
        "module_views",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("display_type", sa.String(length=50), nullable=False, server_default="table"),
        sa.Column("config", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_module_views_entity_type"), "module_views", ["entity_type"], unique=False)
    op.create_index(op.f("ix_module_views_name"), "module_views", ["name"], unique=False)
    op.create_index(op.f("ix_module_views_deleted_at"), "module_views", ["deleted_at"], unique=False)

    # Create custom_fields table (FASE 4)
    op.create_table(
        "custom_fields",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("field_type", sa.String(length=50), nullable=False),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_searchable", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("config", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_custom_fields_entity_type"), "custom_fields", ["entity_type"], unique=False)
    op.create_index(op.f("ix_custom_fields_name"), "custom_fields", ["name"], unique=False)
    op.create_index(op.f("ix_custom_fields_deleted_at"), "custom_fields", ["deleted_at"], unique=False)

    # Create validation_rules table (FASE 5)
    op.create_table(
        "validation_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("rule_type", sa.String(length=50), nullable=False),
        sa.Column("condition", sa.Text(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_validation_rules_entity_type"), "validation_rules", ["entity_type"], unique=False)
    op.create_index(op.f("ix_validation_rules_name"), "validation_rules", ["name"], unique=False)
    op.create_index(op.f("ix_validation_rules_deleted_at"), "validation_rules", ["deleted_at"], unique=False)

    # Create catalogs table (FASE 6)
    op.create_table(
        "catalogs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("key", sa.String(length=255), nullable=False, unique=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_global", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_catalogs_key"), "catalogs", ["key"], unique=True)
    op.create_index(op.f("ix_catalogs_deleted_at"), "catalogs", ["deleted_at"], unique=False)

    # Create catalog_values table (FASE 6)
    op.create_table(
        "catalog_values",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("catalog_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("value", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_catalog_values_catalog_id"), "catalog_values", ["catalog_id"], unique=False)
    op.create_index(op.f("ix_catalog_values_deleted_at"), "catalog_values", ["deleted_at"], unique=False)

    # Create navigation_items table (FASE 7)
    op.create_table(
        "navigation_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("path", sa.String(length=255), nullable=False),
        sa.Column("icon", sa.String(length=100), nullable=True),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("metadata", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["parent_id"], ["navigation_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_navigation_items_order"), "navigation_items", ["order"], unique=False)
    op.create_index(op.f("ix_navigation_items_parent_id"), "navigation_items", ["parent_id"], unique=False)
    op.create_index(op.f("ix_navigation_items_deleted_at"), "navigation_items", ["deleted_at"], unique=False)

    # Create ai_rules table (FASE 8)
    op.create_table(
        "ai_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("trigger_condition", sa.Text(), nullable=False),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("model_id", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("max_retries", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("timeout_seconds", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_rules_entity_type"), "ai_rules", ["entity_type"], unique=False)
    op.create_index(op.f("ix_ai_rules_name"), "ai_rules", ["name"], unique=False)
    op.create_index(op.f("ix_ai_rules_deleted_at"), "ai_rules", ["deleted_at"], unique=False)


def downgrade() -> None:
    # Drop AI rules table
    op.drop_index(op.f("ix_ai_rules_deleted_at"), table_name="ai_rules")
    op.drop_index(op.f("ix_ai_rules_name"), table_name="ai_rules")
    op.drop_index(op.f("ix_ai_rules_entity_type"), table_name="ai_rules")
    op.drop_table("ai_rules")

    # Drop navigation items table
    op.drop_index(op.f("ix_navigation_items_deleted_at"), table_name="navigation_items")
    op.drop_index(op.f("ix_navigation_items_parent_id"), table_name="navigation_items")
    op.drop_index(op.f("ix_navigation_items_order"), table_name="navigation_items")
    op.drop_table("navigation_items")

    # Drop catalog values table
    op.drop_index(op.f("ix_catalog_values_deleted_at"), table_name="catalog_values")
    op.drop_index(op.f("ix_catalog_values_catalog_id"), table_name="catalog_values")
    op.drop_table("catalog_values")

    # Drop catalogs table
    op.drop_index(op.f("ix_catalogs_deleted_at"), table_name="catalogs")
    op.drop_index(op.f("ix_catalogs_key"), table_name="catalogs")
    op.drop_table("catalogs")

    # Drop validation rules table
    op.drop_index(op.f("ix_validation_rules_deleted_at"), table_name="validation_rules")
    op.drop_index(op.f("ix_validation_rules_name"), table_name="validation_rules")
    op.drop_index(op.f("ix_validation_rules_entity_type"), table_name="validation_rules")
    op.drop_table("validation_rules")

    # Drop custom fields table
    op.drop_index(op.f("ix_custom_fields_deleted_at"), table_name="custom_fields")
    op.drop_index(op.f("ix_custom_fields_name"), table_name="custom_fields")
    op.drop_index(op.f("ix_custom_fields_entity_type"), table_name="custom_fields")
    op.drop_table("custom_fields")

    # Drop module views table
    op.drop_index(op.f("ix_module_views_deleted_at"), table_name="module_views")
    op.drop_index(op.f("ix_module_views_name"), table_name="module_views")
    op.drop_index(op.f("ix_module_views_entity_type"), table_name="module_views")
    op.drop_table("module_views")
