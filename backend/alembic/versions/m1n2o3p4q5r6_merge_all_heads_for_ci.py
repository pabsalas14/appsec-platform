"""Merge parallel Alembic heads into a single lineage.

Revision ID: m1n2o3p4q5r6
Revises: 018_email_notifications, a6b8c9daebfc, c9d0e1f2a3b4, f7a1c2b3d4e5, l2m3n4o5p6q7
Create Date: 2026-04-28
"""

from __future__ import annotations

revision = "m1n2o3p4q5r6"
down_revision = (
    "018_email_notifications",
    "a6b8c9daebfc",
    "c9d0e1f2a3b4",
    "f7a1c2b3d4e5",
    "l2m3n4o5p6q7",
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Schema merge marker."""


def downgrade() -> None:
    """Downgrade merge marker."""
