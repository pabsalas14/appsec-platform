"""System settings schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class SystemSettingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    value: Any
    description: Optional[str] = None
    updated_at: datetime


class SystemSettingUpsert(BaseModel):
    value: Any
    description: Optional[str] = None
