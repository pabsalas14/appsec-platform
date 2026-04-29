"""merge alembic heads: SCR tablas (n0) + omnisearch GIN (f9).

Revision ID: p0q1r2s3t4u5
Revises: n0o1p2q3r4s5, f9g5h1i2j3k4
"""

from __future__ import annotations

revision = "p0q1r2s3t4u5"
down_revision = (
    "n0o1p2q3r4s5",
    "f9g5h1i2j3k4",
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Schema merge marker — las tablas SCR están en n0o1p2q3r4s5."""


def downgrade() -> None:
    """Downgrade merge marker."""
