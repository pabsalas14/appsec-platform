"""API v1 router — aggregates all endpoint modules."""

from fastapi import APIRouter
from app.api.v1 import (
    audit_logs,
    auth,
    client_logs,
    dashboard,
    projects,
    tasks,
    uploads,
)
from app.api.v1.admin.router import admin_router

api_router = APIRouter(prefix="/api/v1")

# ─── Modules ─────────────────────────────────────────────────────────────────

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(
    dashboard.router, prefix="/dashboard", tags=["Dashboard"]
)
api_router.include_router(
    audit_logs.router, prefix="/audit-logs", tags=["Audit logs"]
)
api_router.include_router(
    client_logs.router, prefix="/client-logs", tags=["Client logs"]
)
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
api_router.include_router(admin_router, prefix="/admin")


@api_router.get("/", tags=["Root"])
async def root():
    return {"status": "success", "data": {"message": "Welcome to the Framework API"}}
