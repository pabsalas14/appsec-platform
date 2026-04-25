"""Bootstrap del catálogo de permisos y roles de plataforma (Fase 19).

Usado por el panel admin y por ``require_permission`` cuando la tabla ``roles``
aún no tiene filas para el rol del usuario (p. ej. tests aislados con TRUNCATE).
"""

from __future__ import annotations

import inspect

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import DEFAULT_ROLE_PERMISSIONS, VALID_ROLES, P
from app.models.role import Permission, Role


def permission_codes_from_P() -> list[tuple[str, str]]:
    """Itera cada clase bajo ``P`` y devuelve ``(code, description)``."""
    out: list[tuple[str, str]] = []
    for _, cls in inspect.getmembers(P, inspect.isclass):
        group = cls.__name__.lstrip("_")
        for name, value in inspect.getmembers(cls):
            if name.startswith("_") or not isinstance(value, str):
                continue
            out.append((value, f"{group}: {name.title().lower()}"))
    return out


async def ensure_roles_permissions_seeded(db: AsyncSession) -> None:
    """Pobla ``permissions`` y roles por defecto si faltan."""
    perm_row = (await db.execute(select(Permission.id).limit(1))).scalar_one_or_none()
    if perm_row is None:
        for code, desc in permission_codes_from_P():
            db.add(Permission(code=code, description=desc))
        await db.flush()

    existing_roles = {
        r.name for r in (await db.execute(select(Role))).scalars().all()
    }
    perms = {
        p.code: p
        for p in (await db.execute(select(Permission))).scalars().all()
    }

    for role_name in VALID_ROLES:
        if role_name in existing_roles:
            continue
        role_perms_codes = DEFAULT_ROLE_PERMISSIONS.get(role_name, [])
        role = Role(
            name=role_name,
            description=f"Platform role '{role_name}'",
            permissions=[perms[c] for c in role_perms_codes if c in perms],
        )
        db.add(role)
    await db.flush()
