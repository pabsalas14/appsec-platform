"""auto merge heads

Revision ID: cce2f52e83ed
Revises: 3f3ce64e75f1, c66c1dce12cf
Create Date: 2026-04-30 14:10:43.192075
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cce2f52e83ed'
down_revision: Union[str, None] = ('3f3ce64e75f1', 'c66c1dce12cf')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
