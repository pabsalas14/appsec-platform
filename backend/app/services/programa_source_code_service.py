"""ProgramaSourceCode service — async CRUD with enforced per-user ownership."""

from app.models.programa_source_code import ProgramaSourceCode
from app.schemas.programa_source_code import ProgramaSourceCodeCreate, ProgramaSourceCodeUpdate
from app.services.base import BaseService

programa_source_code_svc = BaseService[ProgramaSourceCode, ProgramaSourceCodeCreate, ProgramaSourceCodeUpdate](
    ProgramaSourceCode,
    owner_field="user_id",
    audit_action_prefix="programa_source_code",
)
