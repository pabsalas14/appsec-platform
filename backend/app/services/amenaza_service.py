"""Amenaza service — async CRUD with DREAD score_total auto-calculation.

score_total = (dread_damage + dread_reproducibility + dread_exploitability
               + dread_affected_users + dread_discoverability) / 5

The calculation is performed on every create and update so the stored value
is always consistent with the 5 input fields.
"""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.amenaza import Amenaza
from app.schemas.amenaza import AmenazaCreate, AmenazaUpdate
from app.services.base import BaseService


def _calculate_score(data: dict[str, Any]) -> float | None:
    """Return the DREAD average score if all 5 fields are present."""
    fields = [
        "dread_damage",
        "dread_reproducibility",
        "dread_exploitability",
        "dread_affected_users",
        "dread_discoverability",
    ]
    values = [data.get(f) for f in fields]
    if any(v is None for v in values):
        return None
    return sum(values) / len(values)  # type: ignore[arg-type]


class AmenazaService(BaseService[Amenaza, AmenazaCreate, AmenazaUpdate]):
    """Extends BaseService to auto-calculate DREAD score_total on create/update."""

    async def create(
        self,
        db: AsyncSession,
        schema: AmenazaCreate,
        *,
        extra: dict[str, Any] | None = None,
    ) -> Amenaza:
        data = schema.model_dump()
        score = _calculate_score(data)
        if score is not None:
            data["score_total"] = score

        # merge extra (e.g. user_id) so BaseService scope check passes
        if extra:
            data.update(extra)

        from pydantic import BaseModel as _BM

        class _FlatSchema(_BM):
            model_config = {"extra": "allow"}

        flat = _FlatSchema(**data)
        return await super().create(db, flat, extra=None)  # type: ignore[arg-type]

    async def update(
        self,
        db: AsyncSession,
        record_id: Any,
        schema: AmenazaUpdate,
        *,
        scope: dict[str, Any] | None = None,
    ) -> Amenaza | None:
        record = await self.get(db, record_id, scope=scope)
        if not record:
            return None

        changes = schema.model_dump(exclude_unset=True)

        # Merge existing DREAD fields with new ones for recalculation
        dread_fields = [
            "dread_damage",
            "dread_reproducibility",
            "dread_exploitability",
            "dread_affected_users",
            "dread_discoverability",
        ]
        merged = {f: getattr(record, f) for f in dread_fields}
        merged.update({k: v for k, v in changes.items() if k in dread_fields})
        score = _calculate_score(merged)
        if score is not None:
            changes["score_total"] = score

        for key, value in changes.items():
            setattr(record, key, value)

        await db.flush()
        await db.refresh(record)
        return record


amenaza_svc = AmenazaService(
    Amenaza,
    owner_field="user_id",
    audit_action_prefix="amenaza",
)
