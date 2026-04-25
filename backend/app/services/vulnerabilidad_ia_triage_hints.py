"""Heurísticas de falso positivo por motor (campo `fuente`) para enriquecer el prompt de triaje IA."""

from app.schemas.vulnerabilidad import FUENTES_VALIDAS

_DEFAULT = "Evalúa coherencia del hallazgo con el contexto del activo, la evidencia y el flujo de negocio."

# Textos breves: patrones típicos de FP por orígen (SAST | DAST | SCA | TM | MAST | Auditoria | Tercero)
_MOTOR_HINTS: dict[str, str] = {
    "SAST": (
        "Código estático: descarta ruido por código muerto, tests, generados, terceros sin ejecución en "
        "producción, y reglas genéricas sin sink real. Cuestiona si el dato alcanzable prueba explotación."
    ),
    "DAST": (
        "Prueba dinámica: falsos por sesiones/cookies de prueba, WAF, redirecciones, contenido aún no "
        "autenticado o entornos de staging. Distingue hallazgo reproducible en prod vs anomalía del escáner."
    ),
    "SCA": (
        "Composición: ojo a versiones mal detectadas, dependencias transitivas no usadas, CVE en binarios "
        "no empaquetados, o riesgo mitigado por build sin el componente afectado. Separa parche vs ruido."
    ),
    "TM": (
        "Threat model: riesgo de diseño; suele requerir contexto. Marca falso positivo solo si el escenario "
        "no aplica (p.ej. activo o trust boundary distinto) o quedó obsoleto; si dudas, needs_review."
    ),
    "MAST": (
        "Móvil: considera ofuscación, permisos de debug, emulador vs dispositivo real, y almacenamiento en "
        "Sandbox vs backup en la nube. Evita confundir riesgo teórico con flujo de usuario real."
    ),
    "Auditoria": (
        "Hallazgo humano: valora trazabilidad; FP es raro salvo error de traslado o duplicado. Prioriza "
        "needs_review si falta contexto de negocio."
    ),
    "Tercero": (
        "Proveedor/externo: valida que el resumen se alinea con el reporte compartido; el FP puede venir de "
        "duplicado, mala correlación con activo, o cierre ya validado con el tercero."
    ),
}


def get_motor_triage_hints(fuente: str) -> str:
    """Devuelve guía de triaje acorde al catálogo `fuente`; fallback genérico si el valor no está mapeado."""
    if fuente in FUENTES_VALIDAS and fuente in _MOTOR_HINTS:
        return _MOTOR_HINTS[fuente]
    return _DEFAULT


def all_motors_documented() -> bool:
    """Comprueba que cada fuente de catálogo tenga pista (tests)."""
    return FUENTES_VALIDAS.issubset(_MOTOR_HINTS.keys())
