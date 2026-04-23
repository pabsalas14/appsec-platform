"""
Utilities for safe SQL LIKE / ILIKE searches.

The special SQL wildcard characters ``%`` and ``_`` must be escaped
when they come from user input, otherwise an attacker can manipulate
the search pattern (e.g. ``%`` matches everything).
"""


def sanitize_search_term(term: str) -> str:
    """Escape SQL LIKE/ILIKE wildcard characters in *term*.

    >>> sanitize_search_term("100%_done")
    '100\\\\%\\\\_done'
    """
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
