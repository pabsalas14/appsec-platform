"""Phase 4: Custom Fields — add order column, CustomFieldValue table

Revision ID: h2i3j4k5l6m7
Revises: g1h2i3j4k5l6
Create Date: 2026-04-25 23:45:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "h2i3j4k5l6m7"
down_revision: Union[str, None] = "g1h2i3j4k5l6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add order column to custom_fields
    sa.Alter.Table(
        "custom_fields",
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
    )
    
    # Create custom_field_values table
    sa.create_table(
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
    sa.create_index("ix_custom_field_values_field_id", "custom_field_values", ["field_id"], unique=False)
    sa.create_index("ix_custom_field_values_entity_type", "custom_field_values", ["entity_type"], unique=False)
    sa.create_index("ix_custom_field_values_entity_id", "custom_field_values", ["entity_id"], unique=False)


def downgrade() -> None:
    sa.drop_index("ix_custom_field_values_entity_id", table_name="custom_field_values")
    sa.drop_index("ix_custom_field_values_entity_type", table_name="custom_field_values")
    sa.drop_index("ix_custom_field_values_field_id", table_name="custom_field_values")
    sa.drop_table("custom_field_values")
    sa.alter_table(
        "custom_fields",
        sa.DropColumn("order"),
    )
