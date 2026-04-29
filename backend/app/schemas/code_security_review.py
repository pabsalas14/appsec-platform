"""Schemas CodeSecurityReview — SCR (malicia, hallazgos)."""

import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CodeSecurityReviewBase(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=255)
    estado: str = Field(default="PENDING", description="PENDING | ANALYZING | COMPLETED | FAILED")
    descripcion: str | None = Field(None, max_length=1000)
    progreso: int = Field(default=0, ge=0, le=100)
    rama_analizar: str = Field(..., min_length=1, max_length=255)
    url_repositorio: str | None = Field(None, max_length=2048)
    scan_mode: str = Field(
        ...,
        description="PUBLIC_URL | REPO_TOKEN | BRANCH_TARGET | ORG_BATCH",
    )
    repositorio_id: UUID | None = None
    github_org_slug: str | None = Field(None, max_length=255)
    scan_batch_id: UUID | None = None

    @field_validator("titulo")
    @classmethod
    def validate_titulo(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty or whitespace")
        return v.strip()

    @field_validator("rama_analizar")
    @classmethod
    def validate_rama_analizar(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Branch name cannot be empty")
        # Basic validation for branch names (allow alphanumeric, hyphens, underscores, slashes)
        if not re.match(r"^[a-zA-Z0-9._/-]+$", v):
            raise ValueError("Invalid branch name format")
        return v.strip()

    @field_validator("url_repositorio")
    @classmethod
    def validate_url_repositorio(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        # Basic URL validation for Git repositories
        url_pattern = r"^https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)$"
        if not re.match(url_pattern, v):
            raise ValueError("Invalid repository URL format")
        return v

    @field_validator("scan_mode")
    @classmethod
    def validate_scan_mode(cls, v: str) -> str:
        valid_modes = {"PUBLIC_URL", "REPO_TOKEN", "BRANCH_TARGET", "ORG_BATCH"}
        if v not in valid_modes:
            raise ValueError(f"Invalid scan_mode. Must be one of: {', '.join(valid_modes)}")
        return v

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str) -> str:
        valid_states = {"PENDING", "ANALYZING", "COMPLETED", "FAILED"}
        if v not in valid_states:
            raise ValueError(f"Invalid estado. Must be one of: {', '.join(valid_states)}")
        return v

    @field_validator("github_org_slug")
    @classmethod
    def validate_github_org_slug(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        # GitHub org/username validation
        if not re.match(r"^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$", v):
            raise ValueError("Invalid GitHub organization/username format")
        return v


class CodeSecurityReviewBase(BaseModel):
    titulo: str
    estado: str = Field(default="PENDING", description="PENDING | ANALYZING | COMPLETED | FAILED")
    descripcion: str | None = None
    progreso: int = 0
    rama_analizar: str
    url_repositorio: str | None = None
    scan_mode: str = Field(
        ...,
        description="PUBLIC_URL | REPO_TOKEN | BRANCH_TARGET | ORG_BATCH",
    )
    repositorio_id: UUID | None = None
    github_org_slug: str | None = None
    scan_batch_id: UUID | None = None


class CodeSecurityReviewCreate(CodeSecurityReviewBase):
    """Crear revisión SCR."""


class CodeSecurityReviewUpdate(BaseModel):
    titulo: str | None = None
    estado: str | None = None
    descripcion: str | None = None
    progreso: int | None = None
    rama_analizar: str | None = None
    url_repositorio: str | None = None
    scan_mode: str | None = None
    repositorio_id: UUID | None = None
    github_org_slug: str | None = None
    scan_batch_id: UUID | None = None


class CodeSecurityReviewRead(CodeSecurityReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class CodeSecurityAnalyzeResponse(BaseModel):
    message: str
    review_id: UUID
    status: str


class CodeSecurityOrgBatchCreate(BaseModel):
    github_org_slug: str = Field(..., min_length=1, max_length=255)
    titulo: str = Field(..., min_length=3, max_length=255)
    rama_analizar: str = Field(default="main", min_length=1, max_length=255)


class CodeSecurityOrgBatchResponse(BaseModel):
    batch_id: UUID
    github_org_slug: str
    reviews_created: int
    status: str
