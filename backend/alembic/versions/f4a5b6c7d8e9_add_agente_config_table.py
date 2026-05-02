"""add agente_config table

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-05-01 23:56:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "f4a5b6c7d8e9"
down_revision: Union[str, None] = "e3f4a5b6c7d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "agente_config",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agente_tipo", sa.String(length=50), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("revision_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("patrones_personalizados", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("prompt_sistema_personalizado", sa.Text(), nullable=True),
        sa.Column("parametros_llm", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("proveedor_preferido", sa.String(length=50), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("actualizado_en", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agente_config_agente_tipo", "agente_config", ["agente_tipo"], unique=False)
    op.create_index("ix_agente_config_usuario_id", "agente_config", ["usuario_id"], unique=False)
    op.create_index("ix_agente_config_revision_id", "agente_config", ["revision_id"], unique=False)
    op.create_index("ix_agente_config_tipo_usuario", "agente_config", ["agente_tipo", "usuario_id"], unique=False)
    op.create_index("ix_agente_config_tipo_revision", "agente_config", ["agente_tipo", "revision_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_agente_config_tipo_revision", table_name="agente_config")
    op.drop_index("ix_agente_config_tipo_usuario", table_name="agente_config")
    op.drop_index("ix_agente_config_revision_id", table_name="agente_config")
    op.drop_index("ix_agente_config_usuario_id", table_name="agente_config")
    op.drop_index("ix_agente_config_agente_tipo", table_name="agente_config")
    op.drop_table("agente_config")
