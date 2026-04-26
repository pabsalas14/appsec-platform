"""Phase 8: Complete AI Automation Rules table with trigger/action config

Revision ID: h3j4k5l6m7n8
Revises: g1h2i3j4k5l6
Create Date: 2026-04-25

Transforms ai_rules table to support trigger/action configuration patterns:
- Replace entity_type, trigger_condition, action, model_id with structured configs
- Add trigger_config and action_config JSONB columns
- Add created_by and audit fields for ownership tracking
- Add timeout and retry configuration
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "h3j4k5l6m7n8"
down_revision = "g1h2i3j4k5l6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if table exists before creating
    try:
        # Drop old columns if they exist
        op.drop_column("ai_rules", "entity_type", if_exists=True)
        op.drop_column("ai_rules", "trigger_condition", if_exists=True)
        op.drop_column("ai_rules", "action", if_exists=True)
        op.drop_column("ai_rules", "model_id", if_exists=True)
    except Exception:
        pass

    # Add new columns to ai_rules
    op.add_column("ai_rules", sa.Column("trigger_type", sa.String(length=128), nullable=False, server_default="on_vulnerability_created"))
    op.add_column("ai_rules", sa.Column("trigger_config", postgresql.JSONB(), nullable=False, server_default="'{}'::jsonb"))
    op.add_column("ai_rules", sa.Column("action_type", sa.String(length=128), nullable=False, server_default="send_notification"))
    op.add_column("ai_rules", sa.Column("action_config", postgresql.JSONB(), nullable=False, server_default="'{}'::jsonb"))
    op.add_column("ai_rules", sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("ai_rules", sa.Column("timeout_seconds", sa.Integer(), nullable=False, server_default="30"))
    
    # Rename is_active to enabled if it exists
    try:
        op.alter_column("ai_rules", "is_active", new_column_name="enabled")
    except Exception:
        # Column might not exist, add it
        op.add_column("ai_rules", sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"))

    # Add foreign key for created_by
    op.create_foreign_key(
        "fk_ai_rules_created_by",
        "ai_rules",
        "users",
        ["created_by"],
        ["id"],
        ondelete="SET NULL",
    )

    # Create indexes
    op.create_index("ix_ai_rules_trigger_type", "ai_rules", ["trigger_type"], unique=False)
    op.create_index("ix_ai_rules_action_type", "ai_rules", ["action_type"], unique=False)
    op.create_index("ix_ai_rules_enabled", "ai_rules", ["enabled"], unique=False)
    op.create_index("ix_ai_rules_created_by", "ai_rules", ["created_by"], unique=False)
    
    # Create composite indexes
    op.execute("CREATE INDEX IF NOT EXISTS ix_ai_rule_trigger_enabled ON ai_rules(trigger_type, enabled) WHERE deleted_at IS NULL")
    op.execute("CREATE INDEX IF NOT EXISTS ix_ai_rule_action_enabled ON ai_rules(action_type, enabled) WHERE deleted_at IS NULL")


def downgrade() -> None:
    # Drop indexes
    op.execute("DROP INDEX IF EXISTS ix_ai_rule_action_enabled")
    op.execute("DROP INDEX IF EXISTS ix_ai_rule_trigger_enabled")
    op.drop_index("ix_ai_rules_created_by", table_name="ai_rules")
    op.drop_index("ix_ai_rules_enabled", table_name="ai_rules")
    op.drop_index("ix_ai_rules_action_type", table_name="ai_rules")
    op.drop_index("ix_ai_rules_trigger_type", table_name="ai_rules")

    # Drop foreign key
    op.drop_constraint("fk_ai_rules_created_by", "ai_rules", type_="foreignkey")

    # Drop columns
    op.drop_column("ai_rules", "timeout_seconds")
    op.drop_column("ai_rules", "enabled")
    op.drop_column("ai_rules", "created_by")
    op.drop_column("ai_rules", "action_config")
    op.drop_column("ai_rules", "action_type")
    op.drop_column("ai_rules", "trigger_config")
    op.drop_column("ai_rules", "trigger_type")

    # Restore old columns
    op.add_column("ai_rules", sa.Column("entity_type", sa.String(length=100), nullable=False))
    op.add_column("ai_rules", sa.Column("trigger_condition", sa.Text(), nullable=False))
    op.add_column("ai_rules", sa.Column("action", sa.Text(), nullable=False))
    op.add_column("ai_rules", sa.Column("model_id", sa.String(length=100), nullable=True))
    op.add_column("ai_rules", sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"))
