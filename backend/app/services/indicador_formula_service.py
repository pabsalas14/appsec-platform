"""IndicadorFormula service — async CRUD with enforced per-user ownership."""

from app.models.indicador_formula import IndicadorFormula
from app.schemas.indicador_formula import IndicadorFormulaCreate, IndicadorFormulaUpdate
from app.services.base import BaseService

indicador_formula_svc = BaseService[IndicadorFormula, IndicadorFormulaCreate, IndicadorFormulaUpdate](
    IndicadorFormula,
    owner_field="user_id",
    audit_action_prefix="indicador_formula",
)
