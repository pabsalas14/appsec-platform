"""Add AIAutomationRule model for IA-driven automation rules

Revision ID: f5a6b8c9daeb
Revises: e4f5a6b8c9da
Create Date: 2026-04-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "f5a6b8c9daeb"
down_revision = "e4f5a6b8c9da"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_automation_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nombre", sa.String(length=256), nullable=False),
        sa.Column("trigger_type", sa.String(length=128), nullable=False),
        sa.Column("trigger_config", postgresql.JSONB(), nullable=False, server_default="'{}'::jsonb"),
        sa.Column("action_type", sa.String(length=128), nullable=False),
        sa.Column("action_config", postgresql.JSONB(), nullable=False, server_default="'{}'::jsonb"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_automation_rules_trigger_type", "ai_automation_rules", ["trigger_type"], unique=False)
    op.create_index("ix_ai_automation_rules_action_type", "ai_automation_rules", ["action_type"], unique=False)
    op.create_index("ix_ai_automation_rules_enabled", "ai_automation_rules", ["enabled"], unique=False)
    op.create_index("ix_ai_automation_rules_created_by", "ai_automation_rules", ["created_by"], unique=False)
    op.create_index("ix_ai_automation_rules_deleted_at", "ai_automation_rules", ["deleted_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_ai_automation_rules_deleted_at", table_name="ai_automation_rules")
    op.drop_index("ix_ai_automation_rules_created_by", table_name="ai_automation_rules")
    op.drop_index("ix_ai_automation_rules_enabled", table_name="ai_automation_rules")
    op.drop_index("ix_ai_automation_rules_action_type", table_name="ai_automation_rules")
    op.drop_index("ix_ai_automation_rules_trigger_type", table_name="ai_automation_rules")
    op.drop_table("ai_automation_rules")
