"""ControlSourceCode service — async CRUD with enforced per-user ownership."""

from app.models.control_source_code import ControlSourceCode
from app.schemas.control_source_code import ControlSourceCodeCreate, ControlSourceCodeUpdate
from app.services.base import BaseService

control_source_code_svc = BaseService[ControlSourceCode, ControlSourceCodeCreate, ControlSourceCodeUpdate](
    ControlSourceCode,
    owner_field="user_id",
    audit_action_prefix="control_source_code",
)
