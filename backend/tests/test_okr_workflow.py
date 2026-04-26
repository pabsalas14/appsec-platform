from __future__ import annotations

import pytest
from httpx import AsyncClient


async def _me(client: AsyncClient, headers: dict) -> str:
    resp = await client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 200, resp.text
    return resp.json()["data"]["id"]


async def _create_plan(client: AsyncClient, headers: dict, *, evaluador_id: str) -> str:
    owner_id = await _me(client, headers)
    resp = await client.post(
        "/api/v1/okr_plan_anuals",
        headers=headers,
        json={
            "colaborador_id": owner_id,
            "evaluador_id": evaluador_id,
            "ano": 2026,
            "estado": "draft",
            "fecha_aprobado": None,
            "aprobado_por_id": None,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]["id"]


@pytest.mark.asyncio
async def test_okr_compromiso_weight_cannot_exceed_100(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    evaluador_id = await _me(client, other_auth_headers)
    plan_id = await _create_plan(client, auth_headers, evaluador_id=evaluador_id)

    first = await client.post(
        "/api/v1/okr_compromisos",
        headers=auth_headers,
        json={
            "plan_id": plan_id,
            "categoria_id": None,
            "nombre_objetivo": "Compromiso A",
            "descripcion": "desc",
            "peso_global": 70,
            "fecha_inicio": "2026-01-01T00:00:00Z",
            "fecha_fin": "2026-12-31T00:00:00Z",
            "tipo_medicion": "subitems",
        },
    )
    assert first.status_code == 201, first.text

    second = await client.post(
        "/api/v1/okr_compromisos",
        headers=auth_headers,
        json={
            "plan_id": plan_id,
            "categoria_id": None,
            "nombre_objetivo": "Compromiso B",
            "descripcion": "desc",
            "peso_global": 40,
            "fecha_inicio": "2026-01-01T00:00:00Z",
            "fecha_fin": "2026-12-31T00:00:00Z",
            "tipo_medicion": "subitems",
        },
    )
    assert second.status_code == 400
    assert "peso_global" in second.json()["detail"]


@pytest.mark.asyncio
async def test_okr_subcompromiso_weight_cannot_exceed_100(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    evaluador_id = await _me(client, other_auth_headers)
    plan_id = await _create_plan(client, auth_headers, evaluador_id=evaluador_id)
    compromiso = await client.post(
        "/api/v1/okr_compromisos",
        headers=auth_headers,
        json={
            "plan_id": plan_id,
            "categoria_id": None,
            "nombre_objetivo": "Compromiso",
            "descripcion": "desc",
            "peso_global": 100,
            "fecha_inicio": "2026-01-01T00:00:00Z",
            "fecha_fin": "2026-12-31T00:00:00Z",
            "tipo_medicion": "subitems",
        },
    )
    assert compromiso.status_code == 201, compromiso.text
    compromiso_id = compromiso.json()["data"]["id"]

    first_sub = await client.post(
        "/api/v1/okr_subcompromisos",
        headers=auth_headers,
        json={
            "compromiso_id": compromiso_id,
            "nombre_sub_item": "Sub A",
            "resultado_esperado": "x",
            "peso_interno": 60,
            "evidencia_requerida": True,
        },
    )
    assert first_sub.status_code == 201, first_sub.text

    second_sub = await client.post(
        "/api/v1/okr_subcompromisos",
        headers=auth_headers,
        json={
            "compromiso_id": compromiso_id,
            "nombre_sub_item": "Sub B",
            "resultado_esperado": "x",
            "peso_interno": 50,
            "evidencia_requerida": True,
        },
    )
    assert second_sub.status_code == 400
    assert "peso_interno" in second_sub.json()["detail"]


@pytest.mark.asyncio
async def test_okr_workflow_requires_evidence_and_closes_immutably(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    evaluador_id = await _me(client, other_auth_headers)
    plan_id = await _create_plan(client, auth_headers, evaluador_id=evaluador_id)
    compromiso = await client.post(
        "/api/v1/okr_compromisos",
        headers=auth_headers,
        json={
            "plan_id": plan_id,
            "categoria_id": None,
            "nombre_objetivo": "Compromiso",
            "descripcion": "desc",
            "peso_global": 100,
            "fecha_inicio": "2026-01-01T00:00:00Z",
            "fecha_fin": "2026-12-31T00:00:00Z",
            "tipo_medicion": "subitems",
        },
    )
    assert compromiso.status_code == 201, compromiso.text
    compromiso_id = compromiso.json()["data"]["id"]

    sub = await client.post(
        "/api/v1/okr_subcompromisos",
        headers=auth_headers,
        json={
            "compromiso_id": compromiso_id,
            "nombre_sub_item": "Sub A",
            "resultado_esperado": "x",
            "peso_interno": 100,
            "evidencia_requerida": True,
        },
    )
    assert sub.status_code == 201, sub.text
    sub_id = sub.json()["data"]["id"]

    revision = await client.post(
        "/api/v1/okr_revision_qs",
        headers=auth_headers,
        json={
            "subcompromiso_id": sub_id,
            "quarter": "Q1",
            "avance_reportado": 85,
            "avance_validado": None,
            "comentario_colaborador": "avance",
            "feedback_evaluador": None,
            "estado": "draft",
        },
    )
    assert revision.status_code == 201, revision.text
    revision_id = revision.json()["data"]["id"]

    submit_without_evidence = await client.post(
        f"/api/v1/okr_revision_qs/{revision_id}/submit",
        headers=auth_headers,
        json={"comentario_colaborador": "listo"},
    )
    assert submit_without_evidence.status_code == 400
    assert "evidencia" in submit_without_evidence.json()["detail"].lower()

    evidence = await client.post(
        "/api/v1/okr_evidencias",
        headers=auth_headers,
        json={
            "revision_q_id": revision_id,
            "attachment_id": None,
            "url_evidencia": "https://example.com/evidence",
            "nombre_archivo": "evidence.pdf",
            "tipo_evidencia": "url",
        },
    )
    assert evidence.status_code == 201, evidence.text

    submit = await client.post(
        f"/api/v1/okr_revision_qs/{revision_id}/submit",
        headers=auth_headers,
        json={"comentario_colaborador": "listo"},
    )
    assert submit.status_code == 200, submit.text
    assert submit.json()["data"]["estado"] == "en_revision"

    approve = await client.post(
        f"/api/v1/okr_revision_qs/{revision_id}/approve",
        headers=other_auth_headers,
        json={"avance_validado": 90, "feedback_evaluador": "ok"},
    )
    assert approve.status_code == 200, approve.text
    assert approve.json()["data"]["estado"] == "aprobado"
    assert "score" in approve.json()["meta"]

    reject_without_feedback = await client.post(
        f"/api/v1/okr_revision_qs/{revision_id}/reject",
        headers=other_auth_headers,
        json={"feedback_evaluador": ""},
    )
    assert reject_without_feedback.status_code == 422

    close_missing_feedback = await client.post(
        f"/api/v1/okr_cierre_qs/plans/{plan_id}/close",
        headers=other_auth_headers,
        json={"quarter": "Q1", "retroalimentacion_general": ""},
    )
    assert close_missing_feedback.status_code == 422

    close_q = await client.post(
        f"/api/v1/okr_cierre_qs/plans/{plan_id}/close",
        headers=other_auth_headers,
        json={"quarter": "Q1", "retroalimentacion_general": "Buen desempeño"},
    )
    assert close_q.status_code == 200, close_q.text
    assert close_q.json()["data"]["quarter"] == "Q1"

    approve_after_close = await client.post(
        f"/api/v1/okr_revision_qs/{revision_id}/approve",
        headers=other_auth_headers,
        json={"avance_validado": 92, "feedback_evaluador": "ajuste"},
    )
    assert approve_after_close.status_code == 400
