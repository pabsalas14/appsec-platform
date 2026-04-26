"""Phase 8: ai_rules trigger/action columns (idempotent).

Revision ID: h3j4k5l6m7n8
Revises: mergeg1p6f8_001, c3d4e5f6a7b8
Create Date: 2026-04-25

Requires: merge of kanban/catalogs branches + builders (custom_fields / ai_rules table).
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision = "h3j4k5l6m7n8"
down_revision: Union[str, Sequence[str]] = ("mergeg1p6f8_001", "c3d4e5f6a7b8")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $body$
        BEGIN
          IF to_regclass('public.ai_rules') IS NULL THEN
            RETURN;
          END IF;

          ALTER TABLE ai_rules DROP COLUMN IF EXISTS entity_type;
          ALTER TABLE ai_rules DROP COLUMN IF EXISTS trigger_condition;
          ALTER TABLE ai_rules DROP COLUMN IF EXISTS action;
          ALTER TABLE ai_rules DROP COLUMN IF EXISTS model_id;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'ai_rules' AND column_name = 'trigger_type'
          ) THEN
            ALTER TABLE ai_rules ADD COLUMN trigger_type VARCHAR(128)
              DEFAULT 'on_vulnerability_created' NOT NULL;
          END IF;
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'ai_rules' AND column_name = 'trigger_config'
          ) THEN
            ALTER TABLE ai_rules ADD COLUMN trigger_config JSONB DEFAULT '{}'::jsonb NOT NULL;
          END IF;
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'ai_rules' AND column_name = 'action_type'
          ) THEN
            ALTER TABLE ai_rules ADD COLUMN action_type VARCHAR(128)
              DEFAULT 'send_notification' NOT NULL;
          END IF;
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'ai_rules' AND column_name = 'action_config'
          ) THEN
            ALTER TABLE ai_rules ADD COLUMN action_config JSONB DEFAULT '{}'::jsonb NOT NULL;
          END IF;
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'ai_rules' AND column_name = 'created_by'
          ) THEN
            ALTER TABLE ai_rules ADD COLUMN created_by UUID NULL;
          END IF;
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'ai_rules' AND column_name = 'timeout_seconds'
          ) THEN
            ALTER TABLE ai_rules ADD COLUMN timeout_seconds INTEGER DEFAULT 30 NOT NULL;
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'ai_rules' AND column_name = 'is_active'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'ai_rules' AND column_name = 'enabled'
          ) THEN
            ALTER TABLE ai_rules RENAME COLUMN is_active TO enabled;
          ELSIF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'ai_rules' AND column_name = 'enabled'
          ) THEN
            ALTER TABLE ai_rules ADD COLUMN enabled BOOLEAN DEFAULT true NOT NULL;
          END IF;
        END $body$;
        """
    )

    op.execute(
        """
        DO $fk$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_ai_rules_created_by'
          ) AND to_regclass('public.ai_rules') IS NOT NULL THEN
            ALTER TABLE ai_rules
              ADD CONSTRAINT fk_ai_rules_created_by
              FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
          END IF;
        END $fk$;
        """
    )

    op.execute("CREATE INDEX IF NOT EXISTS ix_ai_rules_trigger_type ON ai_rules (trigger_type)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_ai_rules_action_type ON ai_rules (action_type)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_ai_rules_enabled ON ai_rules (enabled)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_ai_rules_created_by ON ai_rules (created_by)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_ai_rule_trigger_enabled ON ai_rules (trigger_type, enabled) WHERE deleted_at IS NULL"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_ai_rule_action_enabled ON ai_rules (action_type, enabled) WHERE deleted_at IS NULL"
    )


def downgrade() -> None:
    """Irreversible data migration — keep no-op to avoid partial destructive DDL."""
    pass
