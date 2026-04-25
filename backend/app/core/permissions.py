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
    EMERGING_THEMES = _EmergingThemes
    IA = _IA


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

DEFAULT_ROLE_PERMISSIONS: dict[str, list[str]] = {
    "super_admin": _all_codes(),
    "admin": _all_codes(),
    "chief_appsec": (
        _VIEW_CODES
        + _EXPORT_CODES
        + _CATALOG_MUTATION
        + [
            "vulnerabilities.approve",
            "releases.approve",
            "audit_logs.verify",
        ]
    ),
    "lider_programa": (
        [
            "programs.view",
            "programs.create",
            "programs.edit",
            "programs.delete",
            "programs.export",
            "vulnerabilities.view",
            "vulnerabilities.create",
            "vulnerabilities.edit",
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
        ]
    ),
    "analista": (
        [
            "programs.view",
            "programs.create",
            "programs.edit",
            "vulnerabilities.view",
            "vulnerabilities.create",
            "vulnerabilities.edit",
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
        ]
    ),
    "auditor": ([*_VIEW_CODES, "audit_logs.export", "audit_logs.verify", "dashboards.export"]),
    "readonly": [
        "dashboards.view",
        "vulnerabilities.view",
        "releases.view",
        "initiatives.view",
        "programs.view",
        "catalogs.view",
    ],
    "user": _VIEW_CODES + _CATALOG_MUTATION,
}
