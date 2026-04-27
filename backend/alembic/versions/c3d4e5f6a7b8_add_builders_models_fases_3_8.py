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
    # Module views is handled by d3e4f5a6b8c9_add_module_view.py migration
    # op.create_table(
    #     "module_views",
    #     ...
    # )

    # Create custom_fields table (FASE 4)
    op.create_table(
        "custom_fields",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("field_type", sa.String(length=50), nullable=False),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_searchable", sa.Boolean(), nullable=False, server_default=sa.text("false")),
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

    # FASE 5 validation_rules: canonical schema is e4f5a6b8c9da_add_validation_rule (nombre, condition JSONB).

    # FASE 6 catalogs: canonical schema is p6m7n8o9p0q1_add_catalogs (JSONB values, string PK).
    # FASE 7 navigation: canonical schema is a6b8c9daebfc_add_navigation_item (href, orden, visible).
    # Those run on parallel branches; creating duplicate table names here breaks alembic upgrade.

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
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("max_retries", sa.Integer(), nullable=False, server_default=sa.text("3")),
        sa.Column("timeout_seconds", sa.Integer(), nullable=False, server_default=sa.text("30")),
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

    # Drop custom fields table
    op.drop_index(op.f("ix_custom_fields_deleted_at"), table_name="custom_fields")
    op.drop_index(op.f("ix_custom_fields_name"), table_name="custom_fields")
    op.drop_index(op.f("ix_custom_fields_entity_type"), table_name="custom_fields")
    op.drop_table("custom_fields")

    # Drop module views table (handled by d3e4f5a6b8c9_add_module_view.py migration)
    # op.drop_index(op.f("ix_module_views_deleted_at"), table_name="module_views")
    # op.drop_index(op.f("ix_module_views_name"), table_name="module_views")
    # op.drop_index(op.f("ix_module_views_entity_type"), table_name="module_views")
    # op.drop_table("module_views")
