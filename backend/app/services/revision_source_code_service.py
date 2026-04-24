"""RevisionSourceCode service — async CRUD with enforced per-user ownership."""

from app.models.revision_source_code import RevisionSourceCode
from app.schemas.revision_source_code import RevisionSourceCodeCreate, RevisionSourceCodeUpdate
from app.services.base import BaseService

revision_source_code_svc = BaseService[RevisionSourceCode, RevisionSourceCodeCreate, RevisionSourceCodeUpdate](
    RevisionSourceCode,
    owner_field="user_id",
    audit_action_prefix="revision_source_code",
)
