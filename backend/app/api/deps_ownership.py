"""
Ownership enforcement dependency.

Use ``require_ownership(service)`` in any route that targets a single,
owned resource by path param. The dependency fetches the resource scoped
to the current user — if it doesn't exist OR doesn't belong to the user,
the client sees a 404 (no oracle about other users' IDs).

This is the single, declarative way to prevent IDOR. See
docs/adr/0004-ownership-isolation.md.
"""

from typing import Any, Callable

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundException
from app.database import get_db
from app.models.user import User


def require_ownership(
    service: Any,
    *,
    owner_field: str = "user_id",
    id_param: str = "id",
) -> Callable:
    """Dependency factory returning a FastAPI dep that loads an owned resource.

    Parameters
    ----------
    service : BaseService
        The service that exposes ``.get(db, id, scope=...)``.
    owner_field : str
        The column name on the model that stores the owner's id. Defaults to
        ``"user_id"``.
    id_param : str
        Name of the path parameter that carries the resource id. Defaults to
        ``"id"``.

    Returns
    -------
    Callable
        A FastAPI dependency that yields the resource instance or raises
        ``NotFoundException`` (404).
    """

    async def _dep(
        request: Request,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        raw_id = request.path_params[id_param]
        entity = await service.get(
            db, raw_id, scope={owner_field: getattr(current_user, "id")}
        )
        if entity is None:
            raise NotFoundException(f"{service.model.__name__} not found")
        return entity

    return _dep
