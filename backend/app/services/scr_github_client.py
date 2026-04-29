"""Cliente GitHub para SCR usando token dedicado (no inventario)."""

from __future__ import annotations

import base64
import tempfile
from pathlib import Path
from typing import Any

import httpx

from app.config import settings
from app.core.exceptions import BadRequestException
from app.core.logging import logger

_GITHUB_API = "https://api.github.com"


def _auth_headers() -> dict[str, str]:
    token = settings.SCR_GITHUB_TOKEN.strip()
    if not token:
        raise BadRequestException("SCR_GITHUB_TOKEN no configurado.")
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


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
            # Clone con depth=1 para rapidez
            subprocess.run(
                ["git", "clone", "--depth=1", "--branch", branch, "--single-branch", repo_url, tmpdir],
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

    result = []
    for c in commits:
        result.append(
            {
                "commit_hash": c.get("sha", "")[:40],
                "autor": c.get("commit", {}).get("author", {}).get("name", "unknown"),
                "autor_email": c.get("commit", {}).get("author", {}).get("email", ""),
                "timestamp": c.get("commit", {}).get("author", {}).get("date", ""),
                "mensaje": c.get("commit", {}).get("message", "")[:500],
                "url": c.get("html_url", ""),
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
