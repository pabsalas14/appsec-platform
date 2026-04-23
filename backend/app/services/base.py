"""
Generic async CRUD service — BaseService.

Provides reusable ``list``, ``get``, ``create``, ``update``, ``delete``
operations for any SQLAlchemy model + Pydantic schema pair.

Ownership enforcement
---------------------
Set ``owner_field`` to make this service enforce per-owner isolation.
When set, every ``get/update/delete`` MUST receive ``scope={owner_field: value}``
or a ``RuntimeError`` is raised. This prevents IDOR by design.

Transaction ownership
---------------------
This service NEVER calls ``db.commit()``. The caller (``get_db()``) owns the
transaction. See docs/adr/0003-transaction-ownership.md.

Usage::

    task_svc = BaseService[Task, TaskCreate, TaskUpdate](
        Task, owner_field="user_id"
    )

    tasks = await task_svc.list(db, filters={"user_id": user.id})
    task  = await task_svc.get(db, task_id, scope={"user_id": user.id})
    task  = await task_svc.create(db, schema, extra={"user_id": user.id})
    task  = await task_svc.update(db, task_id, schema, scope={"user_id": user.id})
    ok    = await task_svc.delete(db, task_id, scope={"user_id": user.id})
"""

import uuid
from typing import Any, Generic, Sequence, Type, TypeVar

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Base

ModelT = TypeVar("ModelT", bound=Base)
CreateSchemaT = TypeVar("CreateSchemaT", bound=BaseModel)
UpdateSchemaT = TypeVar("UpdateSchemaT", bound=BaseModel)


class BaseService(Generic[ModelT, CreateSchemaT, UpdateSchemaT]):
    """Generic async CRUD service with optional ownership enforcement.

    Set ``audit_action_prefix`` (e.g. ``"task"``) to automatically persist an
    ``audit_logs`` row for every ``create`` / ``update`` / ``delete`` call.
    The prefix becomes the action name (``task.create``, ``task.update`` …).
    The framework's hard rule is: every owned entity sets this prefix so
    mutations are traceable. See ADR-0007.
    """

    def __init__(
        self,
        model: Type[ModelT],
        *,
        owner_field: str | None = None,
        default_order_by: str = "created_at",
        order_desc: bool = True,
        audit_action_prefix: str | None = None,
    ):
        self.model = model
        self.owner_field = owner_field
        self.default_order_by = default_order_by
        self.order_desc = order_desc
        self.audit_action_prefix = audit_action_prefix

    # ─── Internal: scope enforcement ─────────────────────────────────────────

    def _apply_scope(self, stmt, scope: dict[str, Any] | None):
        """Add owner scope to a SELECT stmt, or raise if service requires scope."""
        if self.owner_field is None:
            return stmt
        if not scope or self.owner_field not in scope:
            raise RuntimeError(
                f"{type(self).__name__}[{self.model.__name__}] requires "
                f"scope[{self.owner_field!r}] — probable IDOR vulnerability."
            )
        model_col = getattr(self.model, self.owner_field)
        return stmt.where(model_col == scope[self.owner_field])

    def _apply_not_deleted(self, stmt, *, include_deleted: bool = False):
        """Filter out soft-deleted rows when the model supports it."""
        if include_deleted:
            return stmt
        deleted_at_col = getattr(self.model, "deleted_at", None)
        if deleted_at_col is None:
            return stmt
        return stmt.where(deleted_at_col.is_(None))

    # ─── List ────────────────────────────────────────────────────────────────

    async def list(
        self,
        db: AsyncSession,
        *,
        filters: dict[str, Any] | None = None,
        order_by: str | None = None,
        include_deleted: bool = False,
    ) -> Sequence[ModelT]:
        """Return all records, optionally filtered by column values.

        For owned entities, callers MUST include ``owner_field`` in ``filters``
        (e.g. ``filters={"user_id": user.id}``).
        """
        col_name = order_by or self.default_order_by
        order_col = getattr(self.model, col_name, None)

        stmt = select(self.model)
        stmt = self._apply_not_deleted(stmt, include_deleted=include_deleted)

        if filters:
            for col, val in filters.items():
                model_col = getattr(self.model, col, None)
                if model_col is not None:
                    stmt = stmt.where(model_col == val)

        if self.owner_field is not None and (not filters or self.owner_field not in filters):
            raise RuntimeError(
                f"{type(self).__name__}[{self.model.__name__}].list requires "
                f"filters[{self.owner_field!r}] — probable IDOR vulnerability."
            )

        if order_col is not None:
            stmt = stmt.order_by(order_col.desc() if self.order_desc else order_col.asc())

        result = await db.execute(stmt)
        return result.scalars().all()

    # ─── Get ─────────────────────────────────────────────────────────────────

    async def get(
        self,
        db: AsyncSession,
        record_id: uuid.UUID | int,
        *,
        scope: dict[str, Any] | None = None,
        include_deleted: bool = False,
    ) -> ModelT | None:
        """Return a single record by primary key (scoped if ``owner_field``)."""
        stmt = select(self.model).where(self.model.id == record_id)
        stmt = self._apply_not_deleted(stmt, include_deleted=include_deleted)
        stmt = self._apply_scope(stmt, scope)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    # ─── Create ──────────────────────────────────────────────────────────────

    async def create(
        self,
        db: AsyncSession,
        schema: CreateSchemaT,
        *,
        extra: dict[str, Any] | None = None,
    ) -> ModelT:
        """Create a record from a Pydantic schema.

        ``extra`` is merged into the model data (e.g. ``user_id``). This method
        does NOT commit — ``get_db()`` owns the transaction.
        """
        data = schema.model_dump()
        if extra:
            data.update(extra)

        if self.owner_field is not None and self.owner_field not in data:
            raise RuntimeError(
                f"{type(self).__name__}[{self.model.__name__}].create requires "
                f"extra[{self.owner_field!r}] — probable IDOR vulnerability."
            )

        record = self.model(**data)
        db.add(record)
        await db.flush()
        await db.refresh(record)

        await self._audit(db, "create", record, metadata={"created": _safe_dump(data)})
        return record

    # ─── Update ──────────────────────────────────────────────────────────────

    async def update(
        self,
        db: AsyncSession,
        record_id: uuid.UUID | int,
        schema: UpdateSchemaT,
        *,
        scope: dict[str, Any] | None = None,
    ) -> ModelT | None:
        """Partially update a scoped record. Returns None if not found.

        Does NOT commit — ``get_db()`` owns the transaction.
        """
        record = await self.get(db, record_id, scope=scope)
        if not record:
            return None

        changes = schema.model_dump(exclude_unset=True)
        for key, value in changes.items():
            setattr(record, key, value)

        await db.flush()
        await db.refresh(record)

        await self._audit(
            db, "update", record, metadata={"changes": _safe_dump(changes)}
        )
        return record

    # ─── Delete ──────────────────────────────────────────────────────────────

    async def delete(
        self,
        db: AsyncSession,
        record_id: uuid.UUID | int,
        *,
        scope: dict[str, Any] | None = None,
        actor_id: uuid.UUID | str | None = None,
    ) -> bool:
        """Delete a scoped record. Returns True if deleted, False if not found.

        Does NOT commit — ``get_db()`` owns the transaction.
        """
        record = await self.get(db, record_id, scope=scope)
        if not record:
            return False

        entity_id = getattr(record, "id", None)
        if hasattr(record, "deleted_at"):
            # Soft-delete (A2): keep row, mark as deleted.
            import datetime as _dt

            setattr(record, "deleted_at", _dt.datetime.now(_dt.timezone.utc))
            if hasattr(record, "deleted_by"):
                setattr(record, "deleted_by", _coerce_uuid(actor_id))
            await db.flush()
            await db.refresh(record)
        else:
            await db.delete(record)
            await db.flush()

        await self._audit(
            db,
            "delete",
            None,
            override_entity_id=entity_id,
        )
        return True

    # ─── Audit ──────────────────────────────────────────────────────────────

    async def _audit(
        self,
        db: AsyncSession,
        verb: str,
        record: ModelT | None,
        *,
        metadata: dict[str, Any] | None = None,
        override_entity_id: Any = None,
    ) -> None:
        """Write an audit_logs row when ``audit_action_prefix`` is configured."""
        if not self.audit_action_prefix:
            return
        from app.services.audit_service import record as audit_record

        entity_id = override_entity_id
        if entity_id is None and record is not None:
            entity_id = getattr(record, "id", None)

        await audit_record(
            db,
            action=f"{self.audit_action_prefix}.{verb}",
            entity_type=self.model.__tablename__,
            entity_id=entity_id,
            metadata=metadata,
        )


def _safe_dump(data: dict[str, Any]) -> dict[str, Any]:
    """Stringify values that JSON can't natively serialise (UUID, datetime)."""
    import datetime as _dt
    import uuid as _uuid

    out: dict[str, Any] = {}
    for k, v in data.items():
        if isinstance(v, (_uuid.UUID, _dt.datetime, _dt.date)):
            out[k] = str(v)
        elif isinstance(v, (dict, list, tuple, int, float, str, bool)) or v is None:
            out[k] = v
        else:
            out[k] = str(v)
    return out


def _coerce_uuid(value: Any):
    import uuid as _uuid

    if value is None:
        return None
    if isinstance(value, _uuid.UUID):
        return value
    try:
        return _uuid.UUID(str(value))
    except (ValueError, TypeError):
        return None
