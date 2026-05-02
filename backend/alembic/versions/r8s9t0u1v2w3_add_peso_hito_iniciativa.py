"""Add peso (relative weight) to hito_iniciativas for iniciativa progress spec.

Revision ID: r8s9t0u1v2w3
Revises: i2j3k4l5m6n7
Create Date: 2026-05-02

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "r8s9t0u1v2w3"
down_revision = "i2j3k4l5m6n7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "hito_iniciativas",
        sa.Column("peso", sa.Integer(), nullable=True),
    )
    op.create_check_constraint(
        "ck_hito_iniciativa_peso_positive",
        "hito_iniciativas",
        "peso IS NULL OR (peso >= 1 AND peso <= 10000)",
    )


def downgrade() -> None:
    op.drop_constraint("ck_hito_iniciativa_peso_positive", "hito_iniciativas", type_="check")
    op.drop_column("hito_iniciativas", "peso")
