"""
Standard API response helpers.

All endpoints should return responses through these wrappers to ensure
a consistent contract: ``{status, data, meta?, pagination?}``.
"""

from typing import Any, Optional


def success(
    data: Any,
    *,
    meta: Optional[dict] = None,
) -> dict:
    """Wrap a successful response."""
    response: dict[str, Any] = {"status": "success", "data": data}
    if meta:
        response["meta"] = meta
    return response


def paginated(
    data: list,
    *,
    page: int,
    page_size: int,
    total: int,
    meta: Optional[dict] = None,
) -> dict:
    """Wrap a paginated response."""
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    pagination_meta = {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }
    # Merge with any additional meta provided
    if meta:
        pagination_meta.update(meta)

    response: dict[str, Any] = {
        "status": "success",
        "data": data,
        "meta": pagination_meta,
    }
    return response


def error(
    detail: str | list[Any] | dict[str, Any],
    *,
    code: str | None = None,
) -> dict:
    """Wrap an error response (for use in exception handlers).

    ``detail`` is normally a string; for ``RequestValidationError`` it is the
    list of Pydantic error dicts (see ADR-0001).
    """
    response: dict[str, Any] = {"status": "error", "detail": detail}
    if code:
        response["code"] = code
    return response
