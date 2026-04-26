"""Update ModuleView: add group_by and sort_by as JSON, fix columns_config and sort_by defaults

Revision ID: h5i6j7k8l9m0
Revises: g1h2i3j4k5l6
Create Date: 2026-04-25 23:50:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "h5i6j7k8l9m0"
down_revision = "g1h2i3j4k5l6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing columns to module_views
    op.add_column(
        "module_views",
        sa.Column(
            "group_by",
            sa.String(length=100),
            nullable=True,
        ),
    )
    
    # Rename sort_by from String to JSON
    with op.batch_alter_table("module_views") as batch_op:
        # Drop the old sort_by column
        batch_op.drop_column("sort_by")
        # Add new sort_by as JSON
        batch_op.add_column(
            sa.Column(
                "sort_by",
                postgresql.JSONB(),
                nullable=True,
                server_default="'{}'::jsonb",
            )
        )
        
        # Fix columns_config default
        batch_op.alter_column(
            "columns_config",
            existing_type=postgresql.JSONB(),
            server_default="'{}'::jsonb",
        )
        
        # Add missing user relationship constraints if needed
        # Verify page_size default
        batch_op.alter_column(
            "page_size",
            existing_type=sa.Integer(),
            server_default="25",
        )


def downgrade() -> None:
    with op.batch_alter_table("module_views") as batch_op:
        batch_op.drop_column("group_by")
        batch_op.drop_column("sort_by")
        batch_op.add_column(
            sa.Column(
                "sort_by",
                sa.String(length=128),
                nullable=True,
            )
        )
