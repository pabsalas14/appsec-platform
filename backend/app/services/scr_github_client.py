"""Cliente GitHub para SCR usando token dedicado (no inventario)."""

from __future__ import annotations

import base64
import tempfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx

from app.config import settings
from app.core.exceptions import BadRequestException
from app.core.logging import logger
from app.services.scr_github_context import get_scr_github_bearer_override

_GITHUB_API = "https://api.github.com"


def _resolve_github_bearer() -> str | None:
    override = get_scr_github_bearer_override()
    if override and override.strip():
        return override.strip()
    env_tok = settings.SCR_GITHUB_TOKEN.strip()
    return env_tok or None


def _auth_headers(*, require_token: bool = True) -> dict[str, str]:
    token = _resolve_github_bearer()
    if require_token and not token:
        raise BadRequestException(
            "Sin token GitHub: configura uno en Administración → SCR o define SCR_GITHUB_TOKEN."
        )
    if not token:
        return {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _clone_url_with_auth(repo_url: str) -> str:
    """Inserta x-access-token para clones HTTPS de GitHub cuando hay PAT."""
    tok = _resolve_github_bearer()
    if not tok:
        return repo_url
    u = repo_url.strip()
    if not u.lower().startswith("https://github.com/"):
        return repo_url
    return u.replace("https://github.com/", f"https://x-access-token:{tok}@github.com/", 1)


async def list_accessible_repos(limit: int = 100) -> list[dict[str, Any]]:
    """Lista repos visibles por token SCR."""
    params = {"per_page": min(max(limit, 1), 100), "sort": "updated", "direction": "desc"}
    async with httpx.AsyncClient(timeout=25.0) as client:
        resp = await client.get(f"{_GITHUB_API}/user/repos", headers=_auth_headers(), params=params)
        if resp.status_code >= 400:
            raise BadRequestException(f"GitHub API error ({resp.status_code}) list repos.")
        rows = resp.json()
    return [
        {
            "full_name": r.get("full_name"),
            "default_branch": r.get("default_branch") or "main",
            "visibility": "private" if r.get("private") else "public",
            "html_url": r.get("html_url"),
            "archived": bool(r.get("archived")),
        }
        for r in rows
    ]


async def list_orgs() -> list[str]:
    """Lista organizaciones visibles para el token SCR."""
    async with httpx.AsyncClient(timeout=25.0) as client:
        resp = await client.get(f"{_GITHUB_API}/user/orgs", headers=_auth_headers(), params={"per_page": 100})
        if resp.status_code >= 400:
            raise BadRequestException(f"GitHub API error ({resp.status_code}) list orgs.")
        rows = resp.json()
    return [str(r.get("login")) for r in rows if r.get("login")]


async def list_org_repos(org_slug: str, limit: int = 100) -> list[dict[str, Any]]:
    """Lista repos de una org específica para escaneo ORG_BATCH."""
    params = {"per_page": min(max(limit, 1), 100), "sort": "updated", "direction": "desc"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{_GITHUB_API}/orgs/{org_slug}/repos", headers=_auth_headers(), params=params)
        if resp.status_code == 404:
            raise BadRequestException(f"Organización '{org_slug}' no encontrada o sin acceso.")
        if resp.status_code >= 400:
            raise BadRequestException(f"GitHub API error ({resp.status_code}) list org repos.")
        rows = resp.json()
    return [
        {
            "full_name": r.get("full_name"),
            "name": r.get("name"),
            "default_branch": r.get("default_branch") or "main",
            "visibility": "private" if r.get("private") else "public",
            "html_url": r.get("html_url"),
            "archived": bool(r.get("archived")),
        }
        for r in rows
    ]


async def clone_and_read_repo(repo_url: str, branch: str = "main", max_files: int = 500, max_size_mb: int = 100) -> dict[str, str]:
    """Clona repo y retorna dict {filepath: contenido} para archivos de código.

    Para uso de Inspector Agent. Limita por cantidad de archivos y tamaño total.
    """
    import subprocess

    code_extensions = {".py", ".js", ".ts", ".java", ".go", ".rs", ".cpp", ".c", ".h", ".cs", ".php", ".rb", ".kt", ".scala"}

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            clone_src = _clone_url_with_auth(repo_url)
            # Clone con depth=1 para rapidez
            subprocess.run(
                ["git", "clone", "--depth=1", "--branch", branch, "--single-branch", clone_src, tmpdir],
                timeout=60,
                check=True,
                capture_output=True,
            )
        except subprocess.CalledProcessError as e:
            logger.error(
                "scr.github.clone_failed",
                extra={"url": repo_url, "branch": branch, "stderr": e.stderr.decode()[:500]},
            )
            raise BadRequestException(f"No se pudo clonar {repo_url} rama {branch}")
        except subprocess.TimeoutExpired:
            raise BadRequestException(f"Clone timeout para {repo_url}")

        result = {}
        total_size = 0
        file_count = 0

        for fpath in Path(tmpdir).rglob("*"):
            if file_count >= max_files or total_size >= max_size_mb * 1024 * 1024:
                break

            # Saltar .git y otros
            if ".git" in fpath.parts or "__pycache__" in fpath.parts or "node_modules" in fpath.parts:
                continue

            if fpath.is_file() and fpath.suffix in code_extensions:
                try:
                    content = fpath.read_text(encoding="utf-8", errors="ignore")
                    size = len(content.encode("utf-8"))

                    if total_size + size > max_size_mb * 1024 * 1024:
                        break

                    rel_path = str(fpath.relative_to(tmpdir))
                    result[rel_path] = content
                    total_size += size
                    file_count += 1
                except (OSError, UnicodeDecodeError):
                    pass

        logger.info(
            "scr.github.clone_success",
            extra={"url": repo_url, "files_read": len(result), "total_size_kb": total_size // 1024},
        )
        return result


async def get_commits(repo_url: str, branch: str = "main", limit: int = 100) -> list[dict[str, Any]]:
    """Obtiene commits para Detective agent (timeline forense)."""
    # Parsear owner/repo de la URL
    if "github.com/" not in repo_url:
        raise BadRequestException(f"URL no es de GitHub: {repo_url}")

    parts = repo_url.rstrip("/").split("/")
    owner = parts[-2]
    repo = parts[-1].replace(".git", "")

    params = {"sha": branch, "per_page": min(limit, 100)}
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{_GITHUB_API}/repos/{owner}/{repo}/commits",
            headers=_auth_headers(),
            params=params,
        )
        if resp.status_code >= 400:
            logger.error(
                "scr.github.commits_failed",
                extra={"repo": f"{owner}/{repo}", "status": resp.status_code},
            )
            raise BadRequestException(f"No se pudieron obtener commits para {repo}")
        commits = resp.json()

        details_by_sha: dict[str, dict[str, Any]] = {}
        for commit in commits[: min(limit, 50)]:
            sha = commit.get("sha")
            if not sha:
                continue
            detail_resp = await client.get(
                f"{_GITHUB_API}/repos/{owner}/{repo}/commits/{sha}",
                headers=_auth_headers(),
            )
            if detail_resp.status_code < 400:
                details_by_sha[sha] = detail_resp.json()

    result = []
    for c in commits:
        sha = c.get("sha", "")
        detail = details_by_sha.get(sha, {})
        files = detail.get("files") or []
        file_names = [str(item.get("filename")) for item in files if item.get("filename")]
        lines_changed = sum(int(item.get("changes") or 0) for item in files)
        timestamp_raw = c.get("commit", {}).get("author", {}).get("date", "")
        try:
            timestamp = datetime.fromisoformat(str(timestamp_raw).replace("Z", "+00:00"))
        except ValueError:
            timestamp = datetime.now(UTC)
        result.append(
            {
                "commit_hash": sha[:40],
                "hash": sha[:40],
                "autor": c.get("commit", {}).get("author", {}).get("name", "unknown"),
                "author": c.get("commit", {}).get("author", {}).get("name", "unknown"),
                "autor_email": c.get("commit", {}).get("author", {}).get("email", ""),
                "timestamp": timestamp,
                "mensaje": c.get("commit", {}).get("message", "")[:500],
                "message": c.get("commit", {}).get("message", "")[:500],
                "url": c.get("html_url", ""),
                "files": file_names,
                "lines_changed": lines_changed,
            }
        )

    return result


async def get_file_raw(repo_url: str, file_path: str, branch: str = "main") -> str:
    """Obtiene contenido de archivo específico (para Detective diff analysis)."""
    if "github.com/" not in repo_url:
        raise BadRequestException(f"URL no es de GitHub: {repo_url}")

    parts = repo_url.rstrip("/").split("/")
    owner = parts[-2]
    repo = parts[-1].replace(".git", "")

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{_GITHUB_API}/repos/{owner}/{repo}/contents/{file_path}",
            headers=_auth_headers(),
            params={"ref": branch},
        )
        if resp.status_code == 404:
            return ""  # File not found in this version
        if resp.status_code >= 400:
            raise BadRequestException(f"Error leyendo {file_path}")

        data = resp.json()
        if data.get("encoding") == "base64":
            return base64.b64decode(data.get("content", "")).decode("utf-8", errors="ignore")
        return data.get("content", "")


async def list_github_user_repos(username_or_org: str, limit: int = 100) -> list[dict[str, Any]]:
    """Lista repos de un usuario o organizacion por username.

    Usado en frontend para que usuarios elijan repo a analizar.
    Intenta primero como usuario, si no existe intenta como org.
    """
    params = {"per_page": min(max(limit, 1), 100), "sort": "updated", "direction": "desc"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Primero intenta como org
        resp = await client.get(
            f"{_GITHUB_API}/orgs/{username_or_org}/repos",
            headers=_auth_headers(),
            params=params,
        )

        # Si no es org, intenta como usuario
        if resp.status_code == 404:
            resp = await client.get(
                f"{_GITHUB_API}/users/{username_or_org}/repos",
                headers=_auth_headers(),
                params=params,
            )

        if resp.status_code >= 400:
            raise BadRequestException(
                f"No se encontró usuario u org '{username_or_org}' o sin acceso a repos."
            )

        rows = resp.json()

    return [
        {
            "name": r.get("name"),
            "full_name": r.get("full_name"),
            "owner": r.get("owner", {}).get("login"),
            "url": r.get("html_url"),
            "description": r.get("description"),
            "stars": r.get("stargazers_count", 0),
            "default_branch": r.get("default_branch") or "main",
            "visibility": "private" if r.get("private") else "public",
            "archived": bool(r.get("archived")),
            "updated_at": r.get("updated_at"),
        }
        for r in rows
    ]


async def list_repository_branches(repo_url: str, limit: int = 100) -> list[dict[str, Any]]:
    """Lista branches de un repositorio.

    Usado en frontend para que usuarios elijan rama a analizar.
    """
    if "github.com/" not in repo_url:
        raise BadRequestException(f"URL no es de GitHub: {repo_url}")

    parts = repo_url.rstrip("/").split("/")
    owner = parts[-2]
    repo = parts[-1].replace(".git", "")

    params = {"per_page": min(max(limit, 1), 100)}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{_GITHUB_API}/repos/{owner}/{repo}/branches",
            headers=_auth_headers(),
            params=params,
        )

        if resp.status_code == 404:
            raise BadRequestException(f"Repositorio no encontrado: {owner}/{repo}")
        if resp.status_code >= 400:
            raise BadRequestException(f"Error obteniendo branches: {resp.status_code}")

        rows = resp.json()

    # También traer último commit de cada rama para mostrar en UI
    result = []
    for branch_data in rows:
        branch_name = branch_data.get("name")
        commit_data = branch_data.get("commit", {})

        result.append(
            {
                "name": branch_name,
                "is_default": branch_data.get("protected", False),  # Aproximación: ramas protegidas suelen ser main/master
                "last_commit": {
                    "sha": commit_data.get("sha", "")[:40],
                    "date": commit_data.get("commit", {}).get("author", {}).get("date", ""),
                    "message": commit_data.get("commit", {}).get("message", "")[:100],
                },
            }
        )

    return result


async def validate_github_personal_access_token(token: str) -> dict[str, Any]:
    """
    Valida un PAT contra ``api.github.com`` sin usar el ContextVar SCR ni ``SCR_GITHUB_TOKEN``.
    """
    t = (token or "").strip()
    if len(t) < 10:
        return {
            "valid": False,
            "message": "Formato de token inválido",
            "user": None,
            "organizations": None,
            "repos_count": None,
            "expiration_date": None,
        }

    headers = {
        "Authorization": f"Bearer {t}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    async with httpx.AsyncClient(timeout=25.0) as client:
        ur = await client.get(f"{_GITHUB_API}/user", headers=headers)
        if ur.status_code >= 400:
            return {
                "valid": False,
                "message": f"GitHub respondió {ur.status_code}",
                "user": None,
                "organizations": None,
                "repos_count": None,
                "expiration_date": None,
            }
        u = ur.json()
        or_resp = await client.get(f"{_GITHUB_API}/user/orgs", headers=headers, params={"per_page": 100})
        orgs: list[str] = []
        if or_resp.status_code < 400:
            orgs = [str(r.get("login")) for r in or_resp.json() if r.get("login")]

    return {
        "valid": True,
        "message": "Token válido",
        "user": u.get("login"),
        "organizations": orgs,
        "repos_count": int(u.get("public_repos") or 0),
        "expiration_date": None,
    }
