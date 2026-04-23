"""AuditLog schemas — read-only, admin-scoped."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    ts: datetime
    actor_user_id: UUID | None = None
    action: str
    entity_type: str | None = None
    entity_id: str | None = None
    ip: str | None = None
    user_agent: str | None = None
    request_id: str | None = None
    status: str
    metadata: dict[str, Any] = Field(default_factory=dict, alias="meta")

    @field_validator("ip", mode="before")
    @classmethod
    def _coerce_ip_to_str(cls, v: Any) -> Any:
        # Postgres INET maps to ipaddress.IPv4Address/IPv6Address; serialize as string.
        if v is None:
            return None
        return str(v)
