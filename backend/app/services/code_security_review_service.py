"""CodeSecurityReview service — async CRUD with enforced per-user ownership."""

from app.models.code_security_review import CodeSecurityReview
from app.schemas.code_security_review import CodeSecurityReviewCreate, CodeSecurityReviewUpdate
from app.services.base import BaseService

code_security_review_svc = BaseService[CodeSecurityReview, CodeSecurityReviewCreate, CodeSecurityReviewUpdate](
    CodeSecurityReview,
    owner_field="user_id",
    audit_action_prefix="code_security_review",
)
