"""Consolidate all migration heads into single linear chain

Revision ID: u5v6w7x8y9z0
Revises: a6b8c9daebfc, c3d4e5f6a7b8, f7a1c2b3d4e5, h3j4k5l6m7n8
Create Date: 2026-04-26 00:00:00.000000

This is a merge migration that consolidates all orphaned heads into a single linear chain.
No schema changes needed - this is purely structural.
"""

from typing import Sequence, Union

revision: str = "u5v6w7x8y9z0"
down_revision: Union[str, Sequence[str]] = ("a6b8c9daebfc", "c3d4e5f6a7b8", "f7a1c2b3d4e5", "h3j4k5l6m7n8")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
