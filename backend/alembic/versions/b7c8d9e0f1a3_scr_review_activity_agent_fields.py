"""SCR review — agente_actual y actividad para SSE / UI."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "b7c8d9e0f1a3"
down_revision = "c8bb2165072c"
branch_labels = None
depends_on = None


def _names(inspector, table: str) -> set[str]:
    raw = inspector.get_columns(table)
    return {x["name"] if isinstance(x, dict) else x.name for x in raw}


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = _names(inspector, "code_security_reviews")

    if "agente_actual" not in cols:
        op.add_column("code_security_reviews", sa.Column("agente_actual", sa.String(64), nullable=True))
    if "actividad" not in cols:
        op.add_column("code_security_reviews", sa.Column("actividad", sa.String(512), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = _names(inspector, "code_security_reviews")
    if "actividad" in cols:
        op.drop_column("code_security_reviews", "actividad")
    if "agente_actual" in cols:
        op.drop_column("code_security_reviews", "agente_actual")
