"""Fase 23: cobertura de pistas de triaje IA por motor (fuente)."""

from app.schemas.vulnerabilidad import FUENTES_VALIDAS
from app.services.vulnerabilidad_ia_triage_hints import (
    all_motors_documented,
    get_motor_triage_hints,
)


def test_all_catalog_motors_have_non_trivial_hints() -> None:
    assert all_motors_documented()
    for fuente in FUENTES_VALIDAS:
        hint = get_motor_triage_hints(fuente)
        assert len(hint) >= 40


def test_unknown_fuente_falls_back_to_default() -> None:
    hint = get_motor_triage_hints("NO_EXISTE")
    assert len(hint) >= 20
