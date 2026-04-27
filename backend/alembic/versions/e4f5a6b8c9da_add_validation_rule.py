"""Add ValidationRule model for entity validation rules

Revision ID: e4f5a6b8c9da
Revises: d3e4f5a6b8c9
Create Date: 2026-04-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "e4f5a6b8c9da"
down_revision = "d3e4f5a6b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "validation_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entity_type", sa.String(length=128), nullable=False),
        sa.Column("nombre", sa.String(length=256), nullable=False),
        sa.Column("rule_type", sa.String(length=64), nullable=False),
        sa.Column(
            "condition",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("error_message", sa.String(length=512), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_validation_rules_entity_type", "validation_rules", ["entity_type"], unique=False)
    op.create_index("ix_validation_rules_rule_type", "validation_rules", ["rule_type"], unique=False)
    op.create_index("ix_validation_rules_enabled", "validation_rules", ["enabled"], unique=False)
    op.create_index("ix_validation_rules_created_by", "validation_rules", ["created_by"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_validation_rules_created_by", table_name="validation_rules")
    op.drop_index("ix_validation_rules_enabled", table_name="validation_rules")
    op.drop_index("ix_validation_rules_rule_type", table_name="validation_rules")
    op.drop_index("ix_validation_rules_entity_type", table_name="validation_rules")
    op.drop_table("validation_rules")
