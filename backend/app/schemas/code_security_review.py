"""Schemas CodeSecurityReview — SCR (malicia, hallazgos)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


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
