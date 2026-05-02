"""Add SCR progress tracking fields."""

from alembic import op
import sqlalchemy as sa


revision = "z_add_scr_progress_tracking"
down_revision = None  # Will be set by alembic merge
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if columns already exist before adding
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    raw_cols = inspector.get_columns("code_security_reviews")
    columns = {
        (c["name"] if isinstance(c, dict) else c.name) for c in raw_cols
    }

    if "agente_actual" not in columns:
        op.add_column(
            "code_security_reviews",
            sa.Column("agente_actual", sa.String(50), nullable=True)
        )

    if "actividad" not in columns:
        op.add_column(
            "code_security_reviews",
            sa.Column("actividad", sa.String(500), nullable=True)
        )

    if "tipo_escaneo" not in columns:
        op.add_column(
            "code_security_reviews",
            sa.Column("tipo_escaneo", sa.String(50), nullable=False, server_default="PUBLICO")
        )


def downgrade() -> None:
    op.drop_column("code_security_reviews", "agente_actual")
    op.drop_column("code_security_reviews", "actividad")
    op.drop_column("code_security_reviews", "tipo_escaneo")
