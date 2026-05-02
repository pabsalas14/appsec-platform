"""merge_heads

Revision ID: c8bb2165072c
Revises: cba8581f4209, z_add_scr_progress_tracking
Create Date: 2026-05-01 20:46:34.209573
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8bb2165072c'
down_revision: Union[str, None] = ('cba8581f4209', 'z_add_scr_progress_tracking')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
