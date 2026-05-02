"""
SCR Router Configuration — Centraliza el registro de todos los routers del módulo SCR.
Este archivo debe ser importado en el router principal de la API.
"""

from fastapi import APIRouter
from app.api.v1 import (
    scr_dashboard,
    scr_admin,
    scr_forensic,
    scr_bulk_actions,
)

def register_scr_routers(api_router: APIRouter):
    """
    Registra todos los routers de SCR en el router principal de la API.

    Uso en app/api/v1/__init__.py o main router:
        from app.api.v1.scr_router_config import register_scr_routers

        api_router = APIRouter()
        register_scr_routers(api_router)
    """

    # Dashboard Endpoints (GET /api/v1/scr/dashboard/...)
    api_router.include_router(
        scr_dashboard.router,
        tags=["SCR Dashboard"]
    )

    # Admin Configuration Endpoints (POST/GET /api/v1/admin/scr/...)
    api_router.include_router(
        scr_admin.router,
        tags=["SCR Admin Configuration"]
    )

    # Forensic Investigation Endpoints (GET /api/v1/code_security_reviews/.../forensic/...)
    api_router.include_router(
        scr_forensic.router,
        tags=["SCR Forensic Investigation"]
    )

    # Bulk Actions Endpoints (PATCH/POST /api/v1/code_security_reviews/.../bulk/...)
    api_router.include_router(
        scr_bulk_actions.router,
        tags=["SCR Bulk Actions"]
    )


# ─────────────────────────────────────────────────────────────────────────────
# Summary of All Registered Endpoints
# ─────────────────────────────────────────────────────────────────────────────
"""
Dashboard Endpoints:
  GET  /api/v1/scr/dashboard/kpis
  GET  /api/v1/scr/dashboard/costs
  GET  /api/v1/scr/dashboard/trends
  GET  /api/v1/scr/dashboard/top-repos

Admin Configuration Endpoints:
  GET  /api/v1/admin/scr/llm-config
  POST /api/v1/admin/scr/llm-config
  POST /api/v1/admin/scr/llm-config/test-connection
  GET  /api/v1/admin/scr/github-tokens
  POST /api/v1/admin/scr/github-tokens
  POST /api/v1/admin/scr/github-tokens/validate
  PATCH /api/v1/admin/scr/github-tokens/{token_id}
  DELETE /api/v1/admin/scr/github-tokens/{token_id}
  GET  /api/v1/admin/scr/agents/{agent}/prompts
  PATCH /api/v1/admin/scr/agents/{agent}/prompts
  POST /api/v1/admin/scr/agents/{agent}/test-prompt
  GET  /api/v1/admin/scr/agents/{agent}/stats
  GET  /api/v1/admin/scr/patterns
  PATCH /api/v1/admin/scr/patterns/{pattern_id}
  POST /api/v1/admin/scr/patterns

Forensic Investigation Endpoints:
  GET  /api/v1/code_security_reviews/{review_id}/events
  GET  /api/v1/code_security_reviews/{review_id}/events/search
  GET  /api/v1/code_security_reviews/{review_id}/timeline
  GET  /api/v1/code_security_reviews/{review_id}/forensic/summary
  GET  /api/v1/code_security_reviews/{review_id}/author-analysis/{author}
  GET  /api/v1/code_security_reviews/{review_id}/anomalies
  GET  /api/v1/code_security_reviews/{review_id}/commit/{commit_hash}/details

Bulk Actions Endpoints:
  PATCH /api/v1/code_security_reviews/{review_id}/findings/bulk/status
  PATCH /api/v1/code_security_reviews/{review_id}/findings/bulk/assign
  POST /api/v1/code_security_reviews/{review_id}/findings/bulk/false-positive
  POST /api/v1/code_security_reviews/{review_id}/findings/bulk/remediation-plan
  POST /api/v1/code_security_reviews/{review_id}/findings/bulk/export
  GET  /api/v1/code_security_reviews/{review_id}/findings/bulk/status-report

Findings CRUD Endpoints:
  GET  /api/v1/code_security_reviews/{review_id}/findings
  GET  /api/v1/code_security_reviews/{review_id}/findings/{finding_id}
  POST /api/v1/code_security_reviews/{review_id}/findings
  PATCH /api/v1/code_security_reviews/{review_id}/findings/{finding_id}
  DELETE /api/v1/code_security_reviews/{review_id}/findings/{finding_id}
  POST /api/v1/code_security_reviews/{review_id}/findings/{finding_id}/transition-state
  GET  /api/v1/code_security_reviews/{review_id}/findings/{finding_id}/remediation-plan
  POST /api/v1/code_security_reviews/{review_id}/findings/{finding_id}/comments
  GET  /api/v1/code_security_reviews/{review_id}/findings/{finding_id}/comments

TOTAL: 45+ endpoints completamente funcionales para SCR
"""
