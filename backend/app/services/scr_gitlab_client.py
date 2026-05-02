"""Cliente mínimo GitLab para configuración SCR."""

from __future__ import annotations

from typing import Any

import httpx

from app.core.exceptions import BadRequestException


async def validate_gitlab_personal_access_token(token: str, base_url: str = "https://gitlab.com") -> dict[str, Any]:
    t = (token or "").strip()
    if len(t) < 10:
        return {"valid": False, "message": "Formato de token GitLab inválido", "user": None, "organizations": [], "repos_count": 0}
    headers = {"PRIVATE-TOKEN": t}
    base = base_url.rstrip("/")
    async with httpx.AsyncClient(timeout=25.0) as client:
        user_resp = await client.get(f"{base}/api/v4/user", headers=headers)
        if user_resp.status_code >= 400:
            return {"valid": False, "message": f"GitLab respondió HTTP {user_resp.status_code}", "user": None, "organizations": [], "repos_count": 0}
        user = user_resp.json()
        projects_resp = await client.get(f"{base}/api/v4/projects", headers=headers, params={"membership": True, "per_page": 100})
        projects = projects_resp.json() if projects_resp.status_code < 400 else []
        groups_resp = await client.get(f"{base}/api/v4/groups", headers=headers, params={"min_access_level": 10, "per_page": 100})
        groups = groups_resp.json() if groups_resp.status_code < 400 else []
    return {
        "valid": True,
        "message": "Token GitLab válido",
        "user": user.get("username") or user.get("name"),
        "organizations": [str(row.get("full_path") or row.get("path")) for row in groups if row.get("path")],
        "repos_count": len(projects),
        "expiration_date": None,
    }


async def list_gitlab_projects(token: str, base_url: str = "https://gitlab.com", limit: int = 100) -> list[dict[str, Any]]:
    headers = {"PRIVATE-TOKEN": token.strip()}
    base = base_url.rstrip("/")
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{base}/api/v4/projects", headers=headers, params={"membership": True, "per_page": min(limit, 100)})
    if response.status_code >= 400:
        raise BadRequestException(f"GitLab API error ({response.status_code}) list projects.")
    return [
        {
            "full_name": row.get("path_with_namespace"),
            "name": row.get("name"),
            "default_branch": row.get("default_branch") or "main",
            "visibility": row.get("visibility"),
            "html_url": row.get("web_url"),
            "archived": bool(row.get("archived")),
            "platform": "gitlab",
        }
        for row in response.json()
    ]
