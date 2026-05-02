"""
Centralised permission codes and role definitions.

• ``RolEnum``  — canonical list of valid roles.
• ``P``        — namespace object that exposes every permission code as a typed
                 constant so endpoints never rely on magic-strings.

Add new permission modules here as you build on the framework.
"""

from enum import StrEnum

# ─── Roles ───────────────────────────────────────────────────────────────────


class RolEnum(StrEnum):
    """Valid user roles — 6 platform roles + 2 framework base roles."""

    SUPER_ADMIN = "super_admin"
    CHIEF_APPSEC = "chief_appsec"
    LIDER_PROGRAMA = "lider_programa"
    ANALISTA = "analista"
    AUDITOR = "auditor"
    READONLY = "readonly"
    # Framework base roles (backward compat)
    ADMIN = "admin"
    USER = "user"


VALID_ROLES: list[str] = [r.value for r in RolEnum]


# ─── Permission code constants ───────────────────────────────────────────────


class _Users:
    VIEW = "users.view"
    CREATE = "users.create"
    EDIT = "users.edit"
    DELETE = "users.delete"


class _Tasks:
    VIEW = "tasks.view"
    CREATE = "tasks.create"
    EDIT = "tasks.edit"
    DELETE = "tasks.delete"


class _Vulnerabilities:
    VIEW = "vulnerabilities.view"
    CREATE = "vulnerabilities.create"
    EDIT = "vulnerabilities.edit"
    DELETE = "vulnerabilities.delete"
    APPROVE = "vulnerabilities.approve"
    EXPORT = "vulnerabilities.export"
    IMPORT = "vulnerabilities.import"


class _Releases:
    VIEW = "releases.view"
    CREATE = "releases.create"
    EDIT = "releases.edit"
    DELETE = "releases.delete"
    APPROVE = "releases.approve"
    EXPORT = "releases.export"


class _Initiatives:
    VIEW = "initiatives.view"
    CREATE = "initiatives.create"
    EDIT = "initiatives.edit"
    DELETE = "initiatives.delete"
    EXPORT = "initiatives.export"


class _Audits:
    VIEW = "audits.view"
    CREATE = "audits.create"
    EDIT = "audits.edit"
    DELETE = "audits.delete"
    EXPORT = "audits.export"


class _Programs:
    VIEW = "programs.view"
    CREATE = "programs.create"
    EDIT = "programs.edit"
    DELETE = "programs.delete"
    EXPORT = "programs.export"


class _Dashboards:
    VIEW = "dashboards.view"
    EXPORT = "dashboards.export"
    EDIT = "dashboards.edit"


class _Admin:
    VIEW = "admin.view"
    CREATE = "admin.create"
    EDIT = "admin.edit"
    DELETE = "admin.delete"


class _AuditLogs:
    VIEW = "audit_logs.view"
    EXPORT = "audit_logs.export"
    VERIFY = "audit_logs.verify"


class _Catalogs:
    VIEW = "catalogs.view"
    CREATE = "catalogs.create"
    EDIT = "catalogs.edit"
    DELETE = "catalogs.delete"


class _CodeSecurity:
    """Code Security Review (malicia, SCR) — ajeno al catálogo SAST de vulnerabilities."""

    VIEW = "code_security.view"
    CREATE = "code_security.create"
    EDIT = "code_security.edit"
    DELETE = "code_security.delete"
    EXPORT = "code_security.export"


class _EmergingThemes:
    VIEW = "emerging_themes.view"
    CREATE = "emerging_themes.create"
    EDIT = "emerging_themes.edit"
    DELETE = "emerging_themes.delete"
    EXPORT = "emerging_themes.export"


class _IA:
    VIEW = "ia.view"
    CONFIGURE = "ia.configure"
    EXECUTE = "ia.execute"


class _Inventory:
    REPOS_EXPORT = "inventory.repos.export"
    REPOS_IMPORT = "inventory.repos.import"
    WEB_ASSETS_EXPORT = "inventory.web_assets.export"
    WEB_ASSETS_IMPORT = "inventory.web_assets.import"


class _Notifications:
    VIEW = "notifications.view"
    EDIT = "notifications.edit"


class P:
    """Permission code namespace.  Use ``P.USERS.VIEW`` etc."""

    USERS = _Users
    TASKS = _Tasks
    VULNERABILITIES = _Vulnerabilities
    RELEASES = _Releases
    INITIATIVES = _Initiatives
    AUDITS = _Audits
    PROGRAMS = _Programs
    DASHBOARDS = _Dashboards
    ADMIN = _Admin
    AUDIT_LOGS = _AuditLogs
    CATALOGS = _Catalogs
    CODE_SECURITY = _CodeSecurity
    EMERGING_THEMES = _EmergingThemes
    IA = _IA
    INVENTORY = _Inventory
    NOTIFICATIONS = _Notifications


# ─── Default permission matrix per role ──────────────────────────────────────
# Maps role name → list of permission codes assigned by default at seed time.


def _all_codes() -> list[str]:
    """Collect every permission code from P."""
    import inspect

    codes: list[str] = []
    for _, cls in inspect.getmembers(P, inspect.isclass):
        for name, value in inspect.getmembers(cls):
            if name.startswith("_") or not isinstance(value, str):
                continue
            codes.append(value)
    return sorted(set(codes))


_VIEW_CODES = [c for c in _all_codes() if c.endswith(".view")]
_EXPORT_CODES = [c for c in _all_codes() if c.endswith(".export")]

# Jerarquía org. (subdirección → célula): mutación bajo códigos dedicados
_CATALOG_MUTATION = [
    "catalogs.create",
    "catalogs.edit",
    "catalogs.delete",
]

# Inventario (repositorios DAST/SAST, activo web DAST): import/export masivo (BRD A2/A3)
_INVENTORY_BULK = [
    "inventory.repos.export",
    "inventory.repos.import",
    "inventory.web_assets.export",
    "inventory.web_assets.import",
]

_INVENTORY_EXPORT_ONLY = [
    "inventory.repos.export",
    "inventory.web_assets.export",
]

# G2 — solo mutación; ``notifications.view`` ya está en ``_VIEW_CODES`` para quien
# usa agregado ``_VIEW_CODES`` (evita duplicados en ``role_permissions`` al sembrar).
_NOTIF_CORE = [
    "notifications.edit",
]

# SCR — operación cotidiana igual que otros módulos con ownership (usuarios estándar)
_CODE_SECURITY_OPS = [
    "code_security.create",
    "code_security.edit",
    "code_security.delete",
    "code_security.export",
]

# Programas SAST — export CSV (BRD A3); mismo código que `programs.export`
_PROGRAM_SAST_EXPORT = ["programs.export"]

DEFAULT_ROLE_PERMISSIONS: dict[str, list[str]] = {
    "super_admin": _all_codes(),
    "admin": _all_codes(),
    "chief_appsec": (
        _VIEW_CODES
        + _EXPORT_CODES
        + _CATALOG_MUTATION
        + _INVENTORY_BULK
        + _NOTIF_CORE
        + _CODE_SECURITY_OPS
        + [
            "vulnerabilities.approve",
            "vulnerabilities.import",
            "releases.approve",
            "audit_logs.verify",
        ]
    ),
    "lider_programa": [
        "programs.view",
        "programs.create",
        "programs.edit",
        "programs.delete",
        "programs.export",
        "vulnerabilities.view",
        "vulnerabilities.create",
        "vulnerabilities.edit",
        "vulnerabilities.import",
        "vulnerabilities.export",
        "releases.view",
        "releases.create",
        "releases.edit",
        "releases.export",
        "initiatives.view",
        "initiatives.create",
        "initiatives.edit",
        "initiatives.export",
        "audits.view",
        "audits.create",
        "audits.edit",
        "audits.export",
        "emerging_themes.view",
        "emerging_themes.create",
        "emerging_themes.edit",
        "emerging_themes.export",
        "dashboards.view",
        "dashboards.export",
        "catalogs.view",
        *_CATALOG_MUTATION,
        "tasks.view",
        "tasks.create",
        "tasks.edit",
        "ia.view",
        "ia.execute",
        "notifications.view",
        *_INVENTORY_BULK,
        *_NOTIF_CORE,
        *_CODE_SECURITY_OPS,
        "code_security.view",
    ],
    "analista": [
        "programs.view",
        "programs.create",
        "programs.edit",
        "vulnerabilities.view",
        "vulnerabilities.create",
        "vulnerabilities.edit",
        "vulnerabilities.import",
        "releases.view",
        "releases.create",
        "releases.edit",
        "initiatives.view",
        "audits.view",
        "emerging_themes.view",
        "emerging_themes.create",
        "emerging_themes.edit",
        "dashboards.view",
        "catalogs.view",
        *_CATALOG_MUTATION,
        "tasks.view",
        "tasks.create",
        "tasks.edit",
        "ia.view",
        "ia.execute",
        "notifications.view",
        *_INVENTORY_BULK,
        *_NOTIF_CORE,
        *_PROGRAM_SAST_EXPORT,
        *_CODE_SECURITY_OPS,
        "code_security.view",
    ],
    "auditor": [
        *_VIEW_CODES,
        "audit_logs.export",
        "audit_logs.verify",
        "dashboards.export",
        *_INVENTORY_EXPORT_ONLY,
        *_NOTIF_CORE,
    ],
    "readonly": [
        "dashboards.view",
        "vulnerabilities.view",
        "releases.view",
        "initiatives.view",
        "programs.view",
        "catalogs.view",
        "notifications.view",
        "code_security.view",
    ],
    "user": (
        _VIEW_CODES
        + _CATALOG_MUTATION
        + _INVENTORY_BULK
        + _NOTIF_CORE
        + _PROGRAM_SAST_EXPORT
        + _CODE_SECURITY_OPS
        + ["vulnerabilities.import"]
    ),
}
