"""Merge all parallel heads into unified lineage.

Revision ID: z0a1b2c3d4e5
Revises: a6b8c9daebfc, f7a1c2b3d4e5, l2m3n4o5p6q7, c3d4e5f6a7b8, p0q1r2s3t4u5
Create Date: 2026-05-01 19:40:00.000000
"""

from __future__ import annotations

revision = "z0a1b2c3d4e5"
down_revision = (
    "a6b8c9daebfc",
    "f7a1c2b3d4e5", 
    "l2m3n4o5p6q7",
    "c3d4e5f6a7b8",
    "p0q1r2s3t4u5",
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Schema merge marker - consolidates all migration branches."""


def downgrade() -> None:
    """Downgrade merge marker."""
