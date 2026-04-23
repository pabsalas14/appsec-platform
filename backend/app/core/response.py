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
    response: dict[str, Any] = {
        "status": "success",
        "data": data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }
    if meta:
        response["meta"] = meta
    return response


def error(detail: str, *, code: str | None = None) -> dict:
    """Wrap an error response (for use in exception handlers)."""
    response: dict[str, Any] = {"status": "error", "detail": detail}
    if code:
        response["code"] = code
    return response
