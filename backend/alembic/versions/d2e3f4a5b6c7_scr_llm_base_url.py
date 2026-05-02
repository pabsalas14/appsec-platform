"""add base_url to SCR LLM configurations

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-05-01 16:05:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "d2e3f4a5b6c7"
down_revision: Union[str, None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("scr_llm_configurations", sa.Column("base_url", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("scr_llm_configurations", "base_url")
