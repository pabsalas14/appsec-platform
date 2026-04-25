"""P2: custom_fields JSONB (campos dinámicos) en entidades core por módulo.

Revision ID: f8a0c1d2e3f4
Revises: f7a1c2b3d4e5
Create Date: 2026-04-25
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "f8a0c1d2e3f4"
down_revision: Union[str, None] = "f7a1c2b3d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_JSONB = postgresql.JSONB(astext_type=sa.Text())


def upgrade() -> None:
    op.add_column("vulnerabilidads", sa.Column("custom_fields", _JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")))
    op.add_column("iniciativas", sa.Column("custom_fields", _JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")))
    op.add_column("temas_emergentes", sa.Column("custom_fields", _JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")))
    op.add_column("auditorias", sa.Column("custom_fields", _JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")))


def downgrade() -> None:
    op.drop_column("auditorias", "custom_fields")
    op.drop_column("temas_emergentes", "custom_fields")
    op.drop_column("iniciativas", "custom_fields")
    op.drop_column("vulnerabilidads", "custom_fields")
