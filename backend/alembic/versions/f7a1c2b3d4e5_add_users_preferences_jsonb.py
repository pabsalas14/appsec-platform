"""add users.preferences for G2 (notificaciones) y UI.

Revision ID: f7a1c2b3d4e5
Revises: c8f4a1b2d3e0
Create Date: 2026-04-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "f7a1c2b3d4e5"
down_revision = "c8f4a1b2d3e0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("preferences", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "preferences")
