"""Smoke checks on generated OpenAPI (aligns with BRD P23 — schema as contract)."""

from __future__ import annotations

from app.main import app


def test_openapi_vulnerabilidades_list_exposes_org_celula_filters():
    schema = app.openapi()
    paths = schema.get("paths") or {}
    key = next((p for p in paths if p.rstrip("/").endswith("/vulnerabilidads")), None)
    assert key is not None, "expected /api/v1/vulnerabilidads list path in OpenAPI"
    get_op = paths[key].get("get") or {}
    params = get_op.get("parameters") or []
    names = {p["name"] for p in params if isinstance(p, dict) and "name" in p}
    assert "celula_id" in names
    assert "organizacion_id" in names


def test_openapi_madurez_node_scores_exists():
    schema = app.openapi()
    paths = schema.get("paths") or {}
    hit = any(
        "node-scores" in p and "madurez" in p for p in paths
    )
    assert hit, "expected GET /api/v1/madurez/node-scores in OpenAPI"
