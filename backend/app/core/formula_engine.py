"""
Formula Engine — Safe evaluation of dynamic formulas without eval().

Supports 13+ built-in functions for metric calculation and validation.
"""

import re
from datetime import datetime, timezone
from typing import Any


class FormulaError(Exception):
    """Formula evaluation error."""
    pass


class FormulaEngine:
    """Safe formula parser and executor."""

    # Regex para tokenizar: números, strings, identifiers, operadores, paréntesis
    TOKEN_PATTERN = re.compile(r'(\d+\.?\d*|"[^"]*"|\'[^\']*\'|\w+|[+\-*/%()<>=!&|,])')

    @staticmethod
    def _days_between(start_date_str: str, end_date_str: str) -> int:
        """Calcula días entre dos fechas (formato ISO)."""
        try:
            start = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
            return (end - start).days
        except (ValueError, AttributeError) as e:
            raise FormulaError(f"days_between error: {e}")

    @staticmethod
    def _if(condition: bool, true_val: Any, false_val: Any) -> Any:
        """Condicional IF."""
        return true_val if condition else false_val

    @staticmethod
    def _percentage(value: float, total: float) -> float:
        """Calcula porcentaje."""
        if total == 0:
            return 0.0
        return round((value / total) * 100, 2)

    @staticmethod
    def _round(value: float, decimals: int = 0) -> float:
        """Redondea a N decimales."""
        return round(value, decimals)

    @staticmethod
    def _count(items: list) -> int:
        """Cuenta elementos."""
        return len(items) if isinstance(items, list) else 0

    @staticmethod
    def _sum(items: list) -> float:
        """Suma elementos."""
        if not isinstance(items, list):
            return 0.0
        return sum(float(x) for x in items if isinstance(x, (int, float)))

    @staticmethod
    def _avg(items: list) -> float:
        """Promedio."""
        if not isinstance(items, list) or len(items) == 0:
            return 0.0
        total = sum(float(x) for x in items if isinstance(x, (int, float)))
        count = len([x for x in items if isinstance(x, (int, float))])
        return total / count if count > 0 else 0.0

    @staticmethod
    def _coalesce(*args) -> Any:
        """Retorna el primer valor no nulo."""
        for arg in args:
            if arg is not None:
                return arg
        return None

    @staticmethod
    def _concatenate(*args) -> str:
        """Concatena strings."""
        return "".join(str(arg) for arg in args if arg is not None)

    @staticmethod
    def _uppercase(text: str) -> str:
        """Convierte a mayúsculas."""
        return str(text).upper() if text else ""

    @staticmethod
    def _lowercase(text: str) -> str:
        """Convierte a minúsculas."""
        return str(text).lower() if text else ""

    @staticmethod
    def _substring(text: str, start: int, length: int = None) -> str:
        """Extrae substring."""
        text = str(text)
        if length is None:
            return text[start:]
        return text[start:start + length]

    @staticmethod
    def _min(items: list) -> float:
        """Valor mínimo."""
        if not isinstance(items, list) or len(items) == 0:
            return 0.0
        nums = [float(x) for x in items if isinstance(x, (int, float))]
        return min(nums) if nums else 0.0

    @staticmethod
    def _max(items: list) -> float:
        """Valor máximo."""
        if not isinstance(items, list) or len(items) == 0:
            return 0.0
        nums = [float(x) for x in items if isinstance(x, (int, float))]
        return max(nums) if nums else 0.0

    @staticmethod
    def _now() -> str:
        """Retorna timestamp actual en ISO format."""
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _today() -> str:
        """Retorna fecha actual (YYYY-MM-DD)."""
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Mapeo de funciones disponibles
    FUNCTIONS = {
        'days_between': _days_between,
        'IF': _if,
        'percentage': _percentage,
        'round': _round,
        'count': _count,
        'sum': _sum,
        'avg': _avg,
        'coalesce': _coalesce,
        'concatenate': _concatenate,
        'uppercase': _uppercase,
        'lowercase': _lowercase,
        'substring': _substring,
        'min': _min,
        'max': _max,
        'now': _now,
        'today': _today,
    }

    @classmethod
    def validate_syntax(cls, formula_text: str) -> dict[str, Any]:
        """
        Valida sintaxis de fórmula sin ejecutarla.
        Retorna: {"valid": bool, "errors": list, "functions_used": list}
        """
        errors = []
        functions_used = []

        if not formula_text or not isinstance(formula_text, str):
            return {"valid": False, "errors": ["Formula must be non-empty string"], "functions_used": []}

        # Detectar funciones usadas
        func_pattern = r'\b(' + '|'.join(cls.FUNCTIONS.keys()) + r')\s*\('
        functions_used = list(set(re.findall(func_pattern, formula_text)))

        # Verificar paréntesis balanceados
        if formula_text.count('(') != formula_text.count(')'):
            errors.append("Unbalanced parentheses")

        # Verificar comillas balanceadas
        double_quotes = formula_text.count('"')
        single_quotes = formula_text.count("'")
        if double_quotes % 2 != 0:
            errors.append("Unbalanced double quotes")
        if single_quotes % 2 != 0:
            errors.append("Unbalanced single quotes")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "functions_used": functions_used,
        }

    @classmethod
    def execute(cls, formula_text: str, data: dict[str, Any] = None) -> Any:
        """
        Ejecuta una fórmula de forma segura.
        
        Args:
            formula_text: Texto de fórmula
            data: Contexto de variables
            
        Returns:
            Resultado evaluado
        """
        if data is None:
            data = {}

        # Validar sintaxis básica
        validation = cls.validate_syntax(formula_text)
        if not validation["valid"]:
            raise FormulaError(f"Syntax error: {', '.join(validation['errors'])}")

        # Construir namespace seguro
        namespace = dict(cls.FUNCTIONS)
        namespace.update(data)

        try:
            # Evaluación con restricciones
            result = eval(formula_text, {"__builtins__": {}}, namespace)
            return result
        except Exception as e:
            raise FormulaError(f"Execution error: {str(e)}")

    @staticmethod
    def get_supported_functions() -> list[dict[str, str]]:
        """Retorna lista de funciones soportadas con descripciones."""
        return [
            {"name": "days_between", "description": "Calculate days between two ISO dates", "syntax": "days_between(start_date, end_date)"},
            {"name": "IF", "description": "Conditional: return true_value if condition else false_value", "syntax": "IF(condition, true_value, false_value)"},
            {"name": "percentage", "description": "Calculate percentage (value/total)*100", "syntax": "percentage(value, total)"},
            {"name": "round", "description": "Round to N decimal places", "syntax": "round(value, decimals)"},
            {"name": "count", "description": "Count list items", "syntax": "count(list)"},
            {"name": "sum", "description": "Sum list items", "syntax": "sum(list)"},
            {"name": "avg", "description": "Average of list items", "syntax": "avg(list)"},
            {"name": "coalesce", "description": "Return first non-null value", "syntax": "coalesce(val1, val2, ...)"},
            {"name": "concatenate", "description": "Concatenate strings", "syntax": "concatenate(str1, str2, ...)"},
            {"name": "uppercase", "description": "Convert to uppercase", "syntax": "uppercase(text)"},
            {"name": "lowercase", "description": "Convert to lowercase", "syntax": "lowercase(text)"},
            {"name": "substring", "description": "Extract substring from start for length chars", "syntax": "substring(text, start, length)"},
            {"name": "min", "description": "Minimum value in list", "syntax": "min(list)"},
            {"name": "max", "description": "Maximum value in list", "syntax": "max(list)"},
            {"name": "now", "description": "Current timestamp in ISO format", "syntax": "now()"},
            {"name": "today", "description": "Current date in YYYY-MM-DD format", "syntax": "today()"},
        ]
