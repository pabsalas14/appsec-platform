"""Phase 4: Custom Fields — order column + custom_field_values table

Revision ID: h2i3j4k5l6m7
Revises: h3j4k5l6m7n8
Create Date: 2026-04-25 23:45:00.000000
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "h2i3j4k5l6m7"
down_revision: Union[str, None] = "h3j4k5l6m7n8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE custom_fields
        ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
        """
    )

    op.create_table(
        "custom_field_values",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("field_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_custom_field_values_field_id", "custom_field_values", ["field_id"], unique=False)
    op.create_index("ix_custom_field_values_entity_type", "custom_field_values", ["entity_type"], unique=False)
    op.create_index("ix_custom_field_values_entity_id", "custom_field_values", ["entity_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_custom_field_values_entity_id", table_name="custom_field_values")
    op.drop_index("ix_custom_field_values_entity_type", table_name="custom_field_values")
    op.drop_index("ix_custom_field_values_field_id", table_name="custom_field_values")
    op.drop_table("custom_field_values")
    op.drop_column("custom_fields", "order")
