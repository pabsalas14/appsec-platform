"""Add OKR/MBO module tables.

Revision ID: f1c79cb2f259
Revises: l2m3n4o5p6q7
Create Date: 2026-04-26 14:50:31.564040
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1c79cb2f259"
down_revision: Union[str, None] = "l2m3n4o5p6q7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "okr_categorias",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("nombre", sa.String(length=255), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_okr_categorias_deleted_at"), "okr_categorias", ["deleted_at"], unique=False)
    op.create_index(op.f("ix_okr_categorias_deleted_by"), "okr_categorias", ["deleted_by"], unique=False)
    op.create_index(op.f("ix_okr_categorias_user_id"), "okr_categorias", ["user_id"], unique=False)

    op.create_table(
        "okr_plan_anuals",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("colaborador_id", sa.UUID(), nullable=False),
        sa.Column("evaluador_id", sa.UUID(), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("estado", sa.String(length=255), server_default=sa.text("'draft'"), nullable=False),
        sa.Column("fecha_aprobado", sa.DateTime(timezone=True), nullable=True),
        sa.Column("aprobado_por_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["aprobado_por_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["colaborador_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["evaluador_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_okr_plan_anuals_ano"), "okr_plan_anuals", ["ano"], unique=False)
    op.create_index(op.f("ix_okr_plan_anuals_colaborador_id"), "okr_plan_anuals", ["colaborador_id"], unique=False)
    op.create_index(op.f("ix_okr_plan_anuals_deleted_at"), "okr_plan_anuals", ["deleted_at"], unique=False)
    op.create_index(op.f("ix_okr_plan_anuals_deleted_by"), "okr_plan_anuals", ["deleted_by"], unique=False)
    op.create_index(op.f("ix_okr_plan_anuals_estado"), "okr_plan_anuals", ["estado"], unique=False)
    op.create_index(op.f("ix_okr_plan_anuals_evaluador_id"), "okr_plan_anuals", ["evaluador_id"], unique=False)
    op.create_index(op.f("ix_okr_plan_anuals_user_id"), "okr_plan_anuals", ["user_id"], unique=False)

    op.create_table(
        "okr_compromisos",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("plan_id", sa.UUID(), nullable=False),
        sa.Column("categoria_id", sa.UUID(), nullable=True),
        sa.Column("nombre_objetivo", sa.String(length=255), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("peso_global", sa.Float(), nullable=False),
        sa.Column("fecha_inicio", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fecha_fin", sa.DateTime(timezone=True), nullable=False),
        sa.Column("tipo_medicion", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["categoria_id"], ["okr_categorias.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["plan_id"], ["okr_plan_anuals.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_okr_compromisos_categoria_id"), "okr_compromisos", ["categoria_id"], unique=False)
    op.create_index(op.f("ix_okr_compromisos_deleted_at"), "okr_compromisos", ["deleted_at"], unique=False)
    op.create_index(op.f("ix_okr_compromisos_deleted_by"), "okr_compromisos", ["deleted_by"], unique=False)
    op.create_index(op.f("ix_okr_compromisos_plan_id"), "okr_compromisos", ["plan_id"], unique=False)
    op.create_index(op.f("ix_okr_compromisos_tipo_medicion"), "okr_compromisos", ["tipo_medicion"], unique=False)
    op.create_index(op.f("ix_okr_compromisos_user_id"), "okr_compromisos", ["user_id"], unique=False)

    op.create_table(
        "okr_subcompromisos",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("compromiso_id", sa.UUID(), nullable=False),
        sa.Column("nombre_sub_item", sa.String(length=255), nullable=False),
        sa.Column("resultado_esperado", sa.Text(), nullable=True),
        sa.Column("peso_interno", sa.Float(), nullable=False),
        sa.Column("evidencia_requerida", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["compromiso_id"], ["okr_compromisos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_okr_subcompromisos_compromiso_id"), "okr_subcompromisos", ["compromiso_id"], unique=False)
    op.create_index(op.f("ix_okr_subcompromisos_deleted_at"), "okr_subcompromisos", ["deleted_at"], unique=False)
    op.create_index(op.f("ix_okr_subcompromisos_deleted_by"), "okr_subcompromisos", ["deleted_by"], unique=False)
    op.create_index(op.f("ix_okr_subcompromisos_user_id"), "okr_subcompromisos", ["user_id"], unique=False)

    op.create_table(
        "okr_revision_qs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("subcompromiso_id", sa.UUID(), nullable=False),
        sa.Column("quarter", sa.String(length=255), nullable=False),
        sa.Column("avance_reportado", sa.Float(), nullable=False),
        sa.Column("avance_validado", sa.Float(), nullable=True),
        sa.Column("comentario_colaborador", sa.Text(), nullable=True),
        sa.Column("feedback_evaluador", sa.Text(), nullable=True),
        sa.Column("estado", sa.String(length=255), server_default=sa.text("'draft'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["subcompromiso_id"], ["okr_subcompromisos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_okr_revision_qs_deleted_at"), "okr_revision_qs", ["deleted_at"], unique=False)
    op.create_index(op.f("ix_okr_revision_qs_deleted_by"), "okr_revision_qs", ["deleted_by"], unique=False)
    op.create_index(op.f("ix_okr_revision_qs_estado"), "okr_revision_qs", ["estado"], unique=False)
    op.create_index(op.f("ix_okr_revision_qs_quarter"), "okr_revision_qs", ["quarter"], unique=False)
    op.create_index(op.f("ix_okr_revision_qs_subcompromiso_id"), "okr_revision_qs", ["subcompromiso_id"], unique=False)
    op.create_index(op.f("ix_okr_revision_qs_user_id"), "okr_revision_qs", ["user_id"], unique=False)

    op.create_table(
        "okr_evidencias",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("revision_q_id", sa.UUID(), nullable=False),
        sa.Column("attachment_id", sa.UUID(), nullable=True),
        sa.Column("url_evidencia", sa.String(length=512), nullable=True),
        sa.Column("nombre_archivo", sa.String(length=255), nullable=True),
        sa.Column("tipo_evidencia", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["attachment_id"], ["attachments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["revision_q_id"], ["okr_revision_qs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_okr_evidencias_attachment_id"), "okr_evidencias", ["attachment_id"], unique=False)
    op.create_index(op.f("ix_okr_evidencias_deleted_at"), "okr_evidencias", ["deleted_at"], unique=False)
    op.create_index(op.f("ix_okr_evidencias_deleted_by"), "okr_evidencias", ["deleted_by"], unique=False)
    op.create_index(op.f("ix_okr_evidencias_revision_q_id"), "okr_evidencias", ["revision_q_id"], unique=False)
    op.create_index(op.f("ix_okr_evidencias_user_id"), "okr_evidencias", ["user_id"], unique=False)

    op.create_table(
        "okr_cierre_qs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("plan_id", sa.UUID(), nullable=False),
        sa.Column("quarter", sa.String(length=255), nullable=False),
        sa.Column("retroalimentacion_general", sa.Text(), nullable=False),
        sa.Column("cerrado_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["plan_id"], ["okr_plan_anuals.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_okr_cierre_qs_deleted_at"), "okr_cierre_qs", ["deleted_at"], unique=False)
    op.create_index(op.f("ix_okr_cierre_qs_deleted_by"), "okr_cierre_qs", ["deleted_by"], unique=False)
    op.create_index(op.f("ix_okr_cierre_qs_plan_id"), "okr_cierre_qs", ["plan_id"], unique=False)
    op.create_index(op.f("ix_okr_cierre_qs_quarter"), "okr_cierre_qs", ["quarter"], unique=False)
    op.create_index(op.f("ix_okr_cierre_qs_user_id"), "okr_cierre_qs", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_okr_cierre_qs_user_id"), table_name="okr_cierre_qs")
    op.drop_index(op.f("ix_okr_cierre_qs_quarter"), table_name="okr_cierre_qs")
    op.drop_index(op.f("ix_okr_cierre_qs_plan_id"), table_name="okr_cierre_qs")
    op.drop_index(op.f("ix_okr_cierre_qs_deleted_by"), table_name="okr_cierre_qs")
    op.drop_index(op.f("ix_okr_cierre_qs_deleted_at"), table_name="okr_cierre_qs")
    op.drop_table("okr_cierre_qs")

    op.drop_index(op.f("ix_okr_evidencias_user_id"), table_name="okr_evidencias")
    op.drop_index(op.f("ix_okr_evidencias_revision_q_id"), table_name="okr_evidencias")
    op.drop_index(op.f("ix_okr_evidencias_deleted_by"), table_name="okr_evidencias")
    op.drop_index(op.f("ix_okr_evidencias_deleted_at"), table_name="okr_evidencias")
    op.drop_index(op.f("ix_okr_evidencias_attachment_id"), table_name="okr_evidencias")
    op.drop_table("okr_evidencias")

    op.drop_index(op.f("ix_okr_revision_qs_user_id"), table_name="okr_revision_qs")
    op.drop_index(op.f("ix_okr_revision_qs_subcompromiso_id"), table_name="okr_revision_qs")
    op.drop_index(op.f("ix_okr_revision_qs_quarter"), table_name="okr_revision_qs")
    op.drop_index(op.f("ix_okr_revision_qs_estado"), table_name="okr_revision_qs")
    op.drop_index(op.f("ix_okr_revision_qs_deleted_by"), table_name="okr_revision_qs")
    op.drop_index(op.f("ix_okr_revision_qs_deleted_at"), table_name="okr_revision_qs")
    op.drop_table("okr_revision_qs")

    op.drop_index(op.f("ix_okr_subcompromisos_user_id"), table_name="okr_subcompromisos")
    op.drop_index(op.f("ix_okr_subcompromisos_deleted_by"), table_name="okr_subcompromisos")
    op.drop_index(op.f("ix_okr_subcompromisos_deleted_at"), table_name="okr_subcompromisos")
    op.drop_index(op.f("ix_okr_subcompromisos_compromiso_id"), table_name="okr_subcompromisos")
    op.drop_table("okr_subcompromisos")

    op.drop_index(op.f("ix_okr_compromisos_user_id"), table_name="okr_compromisos")
    op.drop_index(op.f("ix_okr_compromisos_tipo_medicion"), table_name="okr_compromisos")
    op.drop_index(op.f("ix_okr_compromisos_plan_id"), table_name="okr_compromisos")
    op.drop_index(op.f("ix_okr_compromisos_deleted_by"), table_name="okr_compromisos")
    op.drop_index(op.f("ix_okr_compromisos_deleted_at"), table_name="okr_compromisos")
    op.drop_index(op.f("ix_okr_compromisos_categoria_id"), table_name="okr_compromisos")
    op.drop_table("okr_compromisos")

    op.drop_index(op.f("ix_okr_plan_anuals_user_id"), table_name="okr_plan_anuals")
    op.drop_index(op.f("ix_okr_plan_anuals_evaluador_id"), table_name="okr_plan_anuals")
    op.drop_index(op.f("ix_okr_plan_anuals_estado"), table_name="okr_plan_anuals")
    op.drop_index(op.f("ix_okr_plan_anuals_deleted_by"), table_name="okr_plan_anuals")
    op.drop_index(op.f("ix_okr_plan_anuals_deleted_at"), table_name="okr_plan_anuals")
    op.drop_index(op.f("ix_okr_plan_anuals_colaborador_id"), table_name="okr_plan_anuals")
    op.drop_index(op.f("ix_okr_plan_anuals_ano"), table_name="okr_plan_anuals")
    op.drop_table("okr_plan_anuals")

    op.drop_index(op.f("ix_okr_categorias_user_id"), table_name="okr_categorias")
    op.drop_index(op.f("ix_okr_categorias_deleted_by"), table_name="okr_categorias")
    op.drop_index(op.f("ix_okr_categorias_deleted_at"), table_name="okr_categorias")
    op.drop_table("okr_categorias")
