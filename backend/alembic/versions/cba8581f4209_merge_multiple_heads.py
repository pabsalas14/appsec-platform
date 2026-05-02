"""merge multiple heads

Revision ID: cba8581f4209
Revises: 8a98da3cbaab, b2c3d4e5f6g7, z0a1b2c3d4e5
Create Date: 2026-05-01 19:48:09.653906
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cba8581f4209'
down_revision: Union[str, None] = ('8a98da3cbaab', 'b2c3d4e5f6g7', 'z0a1b2c3d4e5')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
