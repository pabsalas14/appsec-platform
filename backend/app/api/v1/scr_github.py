"""SCR — inventario repos/orgs desde token GitHub dedicado (fase 1)."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import require_permission
from app.core.permissions import P
from app.core.response import success
from app.models.user import User
from app.services.scr_github_client import list_accessible_repos, list_org_repos, list_orgs

router = APIRouter()


@router.get("/github/repos")
async def list_github_repos_visible_stub(
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    _: User = current_user
    repos = await list_accessible_repos()
    return success({"configured": True, "repos": repos})


@router.get("/github/orgs")
async def list_github_orgs_stub(current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW))):
    _: User = current_user
    orgs = await list_orgs()
    return success({"configured": True, "orgs": orgs})


@router.get("/github/orgs/{org_slug}/repos")
async def list_github_org_repos(org_slug: str, current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW))):
    _: User = current_user
    repos = await list_org_repos(org_slug)
    return success({"configured": True, "org_slug": org_slug, "repos": repos})
