"""Pydantic schemas for Attachment."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, computed_field


class AttachmentRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    content_type: str
    size: int
    sha256: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def url(self) -> str:
        return f"/api/v1/uploads/{self.id}/download"
