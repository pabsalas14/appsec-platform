"""
Centralised permission codes and role definitions.

• ``RolEnum``  — canonical list of valid roles.
• ``P``        — namespace object that exposes every permission code as a typed
                 constant so endpoints never rely on magic-strings.

Add new permission modules here as you build on the framework.
"""

from enum import Enum


# ─── Roles ───────────────────────────────────────────────────────────────────

class RolEnum(str, Enum):
    """Valid user roles."""
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


class P:
    """Permission code namespace.  Use ``P.USERS.VIEW`` etc."""
    USERS = _Users
    TASKS = _Tasks
