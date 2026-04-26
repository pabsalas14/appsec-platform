"""Consolidate migration heads — navigation branch + dashboards/builders branch.

Revision ID: u5v6w7x8y9z0
Revises: a6b8c9daebfc, h2i3j4k5l6m7
Create Date: 2026-04-26 00:00:00.000000

Merge marker only (no DDL). Ancestors of h2i3j4k5l6m7 already include c3d4e5f6a7b8 and f7a1 paths.
"""

from typing import Sequence, Union

revision: str = "u5v6w7x8y9z0"
down_revision: Union[str, Sequence[str]] = ("a6b8c9daebfc", "h2i3j4k5l6m7")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
