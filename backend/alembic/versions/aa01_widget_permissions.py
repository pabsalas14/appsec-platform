"""Add widget_permissions column to saved_widgets.

Revision ID: aa01_widget_permissions
Revises: z0a1b2c3d4e5
Create Date: 2026-05-03 00:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "aa01_widget_permissions"
down_revision = "z0a1b2c3d4e5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "saved_widgets",
        sa.Column(
            "widget_permissions",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            comment="Granular access control: visibility, shared_with_roles, shared_with_user_ids",
        ),
    )


def downgrade() -> None:
    op.drop_column("saved_widgets", "widget_permissions")
