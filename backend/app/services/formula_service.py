"""Formula service — admin-managed CRUD."""

from app.models.formula import Formula
from app.schemas.formula import FormulaCreate, FormulaUpdate
from app.services.base import BaseService

formula_svc = BaseService[Formula, FormulaCreate, FormulaUpdate](
    Formula,
    audit_action_prefix="formula",
)
