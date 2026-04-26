"""KanbanColumn service — CRUD para columnas del kanban de releases."""

from __future__ import annotations

from app.models.kanban_column import KanbanColumn
from app.schemas.kanban_release import KanbanColumnCreate, KanbanColumnRead
from app.services.base import BaseService

kanban_column_svc = BaseService[KanbanColumn, KanbanColumnCreate, KanbanColumnRead](
    KanbanColumn,
    audit_action_prefix="kanban_column",
)
