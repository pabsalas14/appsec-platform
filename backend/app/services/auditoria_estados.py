"""Máquina de estados para Auditoría — transiciones validadas según BRD."""

from __future__ import annotations

from uuid import UUID

from app.core.exceptions import ForbiddenException, ValidationException
from app.models.user import User

# Estados normalizados (mayúsculas, sin acentos opcionales en entrada)
_ALIASES: dict[str, str] = {
    "PLANIFICADA": "PLANIFICADA",
    "PLANIFICADO": "PLANIFICADA",
    "EJECUCION": "EJECUCION",
    "EJECUCIÓN": "EJECUCION",
    "EJECUTION": "EJECUCION",
    "REVISION": "REVISION",
    "REVISIÓN": "REVISION",
    "REVIEW": "REVISION",
    "CERRADA": "CERRADA",
    "CERRADO": "CERRADA",
    "CLOSED": "CERRADA",
}


def normalize_auditoria_estado(raw: str | None) -> str | None:
    if raw is None:
        return None
    s = raw.strip().upper()
    # quitar acentos simples
    trans = str.maketrans({"Ó": "O", "Á": "A", "É": "E", "Í": "I", "Ú": "U"})
    s = s.translate(trans)
    return _ALIASES.get(s, raw.strip())


def assert_auditoria_transition_allowed(
    *,
    prev_raw: str,
    next_raw: str,
    actor: User,
    owner_user_id: UUID,
) -> None:
    """Levanta ValidationException/ForbiddenException si la transición no está permitida."""
    prev = normalize_auditoria_estado(prev_raw) or prev_raw.strip().upper()
    nxt = normalize_auditoria_estado(next_raw)
    if not nxt:
        raise ValidationException("estado de auditoría inválido")

    # Permitir no-op
    if prev == nxt:
        return

    role = (actor.role or "").lower()
    is_admin = role in {"admin", "super_admin"}
    is_owner = actor.id == owner_user_id
    # “jefe” / cierre: rol privilegiado de auditoría o admin
    is_chief = role in {"chief_appsec", "lider_programa", "admin", "super_admin"}

    if prev == "PLANIFICADA" and nxt == "EJECUCION":
        if not is_admin:
            raise ForbiddenException("Solo administradores pueden pasar de Planificada a Ejecución")
        return
    if prev == "EJECUCION" and nxt == "REVISION":
        if not is_owner:
            raise ForbiddenException("Solo el responsable (dueño) puede pasar de Ejecución a Revisión")
        return
    if prev == "REVISION" and nxt == "CERRADA":
        if not is_chief:
            raise ForbiddenException("Solo un rol de jefe o administrador puede cerrar la auditoría")
        return

    raise ValidationException(f"Transición no permitida: {prev!r} → {nxt!r}")
