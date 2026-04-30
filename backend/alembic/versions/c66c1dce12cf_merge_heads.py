"""Merge heads

Revision ID: c66c1dce12cf
Revises: 49de356ce8ff
Create Date: 2026-04-30 06:24:49.644104
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c66c1dce12cf'
down_revision: Union[str, None] = '49de356ce8ff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
