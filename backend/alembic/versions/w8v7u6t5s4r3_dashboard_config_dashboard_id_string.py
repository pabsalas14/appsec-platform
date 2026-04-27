"""DashboardConfig.dashboard_id as string (slug or UUID text), drop FK to custom_dashboards.

Revision ID: w8v7u6t5s4r3
Revises: z9y8x7w6v5u4
Create Date: 2026-04-26

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "w8v7u6t5s4r3"
down_revision: Union[str, None] = "z9y8x7w6v5u4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("dashboard_config_dashboard_id_fkey", "dashboard_config", type_="foreignkey")
    op.alter_column(
        "dashboard_config",
        "dashboard_id",
        existing_type=postgresql.UUID(as_uuid=True),
        type_=sa.String(length=100),
        postgresql_using="dashboard_id::text",
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "dashboard_config",
        "dashboard_id",
        existing_type=sa.String(length=100),
        type_=postgresql.UUID(as_uuid=True),
        postgresql_using="dashboard_id::uuid",
        existing_nullable=False,
    )
    op.create_foreign_key(
        "dashboard_config_dashboard_id_fkey",
        "dashboard_config",
        "custom_dashboards",
        ["dashboard_id"],
        ["id"],
        ondelete="CASCADE",
    )
