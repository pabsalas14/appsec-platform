"""Merge heads

Revision ID: 49de356ce8ff
Revises: f9g5h1i2j3k4, m1n2o3p4q5r6
Create Date: 2026-04-30 06:24:31.782498
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '49de356ce8ff'
down_revision: Union[str, None] = ('f9g5h1i2j3k4', 'm1n2o3p4q5r6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
