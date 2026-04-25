"""backfill audit hash chain

Revision ID: c69d11e665e1
Revises: 9bb11b4121c0
Create Date: 2026-04-23 01:33:52.073289
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import hashlib
import json


# revision identifiers, used by Alembic.
revision: str = "c69d11e665e1"
down_revision: Union[str, None] = "9bb11b4121c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(
            """
            SELECT
              id, ts, actor_user_id, action, entity_type, entity_id,
              ip, user_agent, request_id, status, metadata
            FROM audit_logs
            ORDER BY ts ASC, id ASC
            """
        )
    ).fetchall()

    prev: str | None = None
    for r in rows:
        stable_meta = json.dumps(r.metadata or {}, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        parts = [
            "v1",
            prev or "",
            str(r.id),
            str(r.ts),
            str(r.actor_user_id) if r.actor_user_id else "",
            r.action or "",
            r.entity_type or "",
            r.entity_id or "",
            str(r.ip) if r.ip else "",
            r.user_agent or "",
            r.request_id or "",
            r.status or "",
            stable_meta,
        ]
        payload = "\n".join(parts).encode("utf-8")
        row_hash = hashlib.sha256(payload).hexdigest()

        conn.execute(
            sa.text(
                """
                UPDATE audit_logs
                SET prev_hash = :prev, row_hash = :row
                WHERE id = :id
                """
            ),
            {"prev": prev, "row": row_hash, "id": r.id},
        )
        prev = row_hash


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("UPDATE audit_logs SET prev_hash = NULL, row_hash = NULL"))
