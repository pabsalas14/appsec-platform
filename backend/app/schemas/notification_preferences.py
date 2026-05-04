"""Preferencias de notificaciones (JSONB en `users.preferences`)."""

from __future__ import annotations

from pydantic import BaseModel


class NotificationPreferencesRead(BaseModel):
    notificaciones_automaticas: bool = True
    sla_vulnerabilidad: bool = True
    tema_estancado: bool = True
    vulnerabilidad_inactiva: bool = True
    iniciativa_fecha_fin_vencida: bool = True
    plan_remediacion_fecha_limite_vencida: bool = True
    auditoria_estado: bool = True


class NotificationPreferencesPatch(BaseModel):
    notificaciones_automaticas: bool | None = None
    sla_vulnerabilidad: bool | None = None
    tema_estancado: bool | None = None
    vulnerabilidad_inactiva: bool | None = None
    iniciativa_fecha_fin_vencida: bool | None = None
    plan_remediacion_fecha_limite_vencida: bool | None = None
    auditoria_estado: bool | None = None

    model_config = {"extra": "forbid"}


def _nested_bool(nested: dict, key: str, legacy_keys: tuple[str, ...] = ()) -> bool:
    if key in nested:
        return nested[key] is not False
    for lk in legacy_keys:
        if lk in nested:
            return nested[lk] is not False
    return True


def read_prefs_from_user(prefs: object | None) -> NotificationPreferencesRead:
    if not isinstance(prefs, dict):
        return NotificationPreferencesRead()
    n = prefs.get("notifications")
    nested = n if isinstance(n, dict) else {}
    return NotificationPreferencesRead(
        notificaciones_automaticas=prefs.get("notificaciones_automaticas", True) is not False,
        sla_vulnerabilidad=_nested_bool(nested, "sla_vulnerabilidad"),
        tema_estancado=_nested_bool(nested, "tema_estancado"),
        vulnerabilidad_inactiva=_nested_bool(nested, "vulnerabilidad_inactiva"),
        iniciativa_fecha_fin_vencida=_nested_bool(
            nested, "iniciativa_fecha_fin_vencida", ("iniciativa_vencida",)
        ),
        plan_remediacion_fecha_limite_vencida=_nested_bool(
            nested, "plan_remediacion_fecha_limite_vencida", ("plan_remediacion_vencido",)
        ),
        auditoria_estado=_nested_bool(nested, "auditoria_estado"),
    )


def merge_prefs_patch(prefs: dict | None, patch: NotificationPreferencesPatch) -> dict:
    merged = dict(prefs or {})
    raw = patch.model_dump(exclude_unset=True)
    top = raw.pop("notificaciones_automaticas", None)
    if top is not None:
        merged["notificaciones_automaticas"] = top
    n = dict(merged.get("notifications") or {})
    for k, v in raw.items():
        if v is not None:
            n[k] = v
    merged["notifications"] = n
    return merged
