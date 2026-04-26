"""Build minimal valid FK chains for API integration tests (org hierarchy + programs)."""

from __future__ import annotations

import uuid

from httpx import AsyncClient


def _u() -> str:
    return uuid.uuid4().hex[:8]


async def create_org_hierarchy(client: AsyncClient, headers: dict[str, str]) -> dict[str, str]:
    """direccion → subdireccion → gerencia → organizacion (plataforma)."""
    x = _u()
    direccion = await client.post(
        "/api/v1/direccions",
        headers=headers,
        json={"nombre": f"Dir {x}", "codigo": f"DIR-{x}", "descripcion": "t"},
    )
    assert direccion.status_code == 201, direccion.text
    direccion_id = direccion.json()["data"]["id"]
    sub = await client.post(
        "/api/v1/subdireccions",
        headers=headers,
        json={"nombre": f"Sub {x}", "codigo": f"SUB-{x}", "descripcion": "t", "direccion_id": direccion_id},
    )
    assert sub.status_code == 201, sub.text
    sub_id = sub.json()["data"]["id"]
    ger = await client.post(
        "/api/v1/gerencias",
        headers=headers,
        json={"nombre": f"Ger {x}", "subdireccion_id": sub_id, "descripcion": "t"},
    )
    assert ger.status_code == 201, ger.text
    ger_id = ger.json()["data"]["id"]
    org = await client.post(
        "/api/v1/organizacions",
        headers=headers,
        json={
            "nombre": f"Org {x}",
            "codigo": f"ORG-{x}",
            "descripcion": "t",
            "gerencia_id": ger_id,
            "plataforma": "GitHub",
        },
    )
    assert org.status_code == 201, org.text
    org_id = org.json()["data"]["id"]
    return {
        "direccion_id": direccion_id,
        "organizacion_id": org_id,
        "subdireccion_id": sub_id,
        "gerencia_id": ger_id,
    }


async def create_celula_id(client: AsyncClient, headers: dict[str, str]) -> str:
    h = await create_org_hierarchy(client, headers)
    x = _u()
    cel = await client.post(
        "/api/v1/celulas",
        headers=headers,
        json={
            "nombre": f"Cel {x}",
            "tipo": "Dev",
            "descripcion": "t",
            "organizacion_id": h["organizacion_id"],
        },
    )
    assert cel.status_code == 201, cel.text
    return cel.json()["data"]["id"]


async def create_servicio_id(client: AsyncClient, headers: dict[str, str]) -> str:
    cel_id = await create_celula_id(client, headers)
    x = _u()
    svc = await client.post(
        "/api/v1/servicios",
        headers=headers,
        json={"nombre": f"Srv {x}", "criticidad": "Alta", "celula_id": cel_id},
    )
    assert svc.status_code == 201, svc.text
    return svc.json()["data"]["id"]


async def create_repositorio_id(client: AsyncClient, headers: dict[str, str]) -> str:
    cel_id = await create_celula_id(client, headers)
    cel = await client.get(f"/api/v1/celulas/{cel_id}", headers=headers)
    assert cel.status_code == 200, cel.text
    organizacion_id = cel.json()["data"]["organizacion_id"]
    x = _u()
    repo = await client.post(
        "/api/v1/repositorios",
        headers=headers,
        json={
            "nombre": f"Repo {x}",
            "url": f"https://github.com/example/{x}",
            "plataforma": "GitHub",
            "rama_default": "main",
            "organizacion_id": organizacion_id,
            "celula_id": cel_id,
        },
    )
    assert repo.status_code == 201, repo.text
    return repo.json()["data"]["id"]


async def create_activo_web_id(client: AsyncClient, headers: dict[str, str]) -> str:
    cel_id = await create_celula_id(client, headers)
    x = _u()
    aw = await client.post(
        "/api/v1/activo_webs",
        headers=headers,
        json={
            "nombre": f"Web {x}",
            "url": f"https://example.com/{x}",
            "ambiente": "Staging",
            "tipo": "app",
            "celula_id": cel_id,
        },
    )
    assert aw.status_code == 201, aw.text
    return aw.json()["data"]["id"]


async def create_aplicacion_movil_id(client: AsyncClient, headers: dict[str, str]) -> str:
    cel_id = await create_celula_id(client, headers)
    x = _u()
    am = await client.post(
        "/api/v1/aplicacion_movils",
        headers=headers,
        json={
            "nombre": f"App {x}",
            "plataforma": "Android",
            "bundle_id": f"com.example.{x}",
            "celula_id": cel_id,
        },
    )
    assert am.status_code == 201, am.text
    return am.json()["data"]["id"]


async def create_programa_sast_id(client: AsyncClient, headers: dict[str, str]) -> str:
    repo_id = await create_repositorio_id(client, headers)
    x = _u()
    pr = await client.post(
        "/api/v1/programa_sasts",
        headers=headers,
        json={
            "nombre": f"SAST {x}",
            "ano": 2024,
            "descripcion": "t",
            "repositorio_id": repo_id,
            "estado": "Activo",
        },
    )
    assert pr.status_code == 201, pr.text
    return pr.json()["data"]["id"]


async def create_actividad_mensual_sast_id(client: AsyncClient, headers: dict[str, str]) -> str:
    ps_id = await create_programa_sast_id(client, headers)
    ac = await client.post(
        "/api/v1/actividad_mensual_sasts",
        headers=headers,
        json={
            "programa_sast_id": ps_id,
            "mes": 3,
            "ano": 2024,
            "total_hallazgos": 5,
            "criticos": 1,
            "altos": 2,
            "medios": 2,
            "bajos": 0,
        },
    )
    assert ac.status_code == 201, ac.text
    return ac.json()["data"]["id"]


async def create_programa_dast_id(client: AsyncClient, headers: dict[str, str]) -> str:
    aw_id = await create_activo_web_id(client, headers)
    x = _u()
    pd = await client.post(
        "/api/v1/programa_dasts",
        headers=headers,
        json={
            "nombre": f"DAST {x}",
            "ano": 2024,
            "descripcion": "t",
            "activo_web_id": aw_id,
            "estado": "Activo",
        },
    )
    assert pd.status_code == 201, pd.text
    return pd.json()["data"]["id"]


async def create_ejecucion_dast_id(client: AsyncClient, headers: dict[str, str]) -> str:
    pid = await create_programa_dast_id(client, headers)
    ej = await client.post(
        "/api/v1/ejecucion_dasts",
        headers=headers,
        json={
            "programa_dast_id": pid,
            "fecha_inicio": "2024-03-01T10:00:00+00:00",
            "fecha_fin": "2024-03-01T11:00:00+00:00",
            "ambiente": "Staging",
            "herramienta": "OWASP ZAP",
            "resultado": "Exitosa",
        },
    )
    assert ej.status_code == 201, ej.text
    return ej.json()["data"]["id"]


async def create_ejecucion_mast_id(client: AsyncClient, headers: dict[str, str]) -> str:
    app_id = await create_aplicacion_movil_id(client, headers)
    em = await client.post(
        "/api/v1/ejecucion_masts",
        headers=headers,
        json={
            "aplicacion_movil_id": app_id,
            "ambiente": "Staging",
            "fecha_inicio": "2024-03-01T10:00:00+00:00",
            "fecha_fin": "2024-03-01T11:00:00+00:00",
            "resultado": "Completada",
        },
    )
    assert em.status_code == 201, em.text
    return em.json()["data"]["id"]


async def create_programa_tm_id(client: AsyncClient, headers: dict[str, str]) -> str:
    svc_id = await create_servicio_id(client, headers)
    x = _u()
    p = await client.post(
        "/api/v1/programa_threat_modelings",
        headers=headers,
        json={
            "nombre": f"TM {x}",
            "ano": 2024,
            "descripcion": "t",
            "servicio_id": svc_id,
            "estado": "Activo",
        },
    )
    assert p.status_code == 201, p.text
    return p.json()["data"]["id"]


async def create_sesion_tm_id(client: AsyncClient, headers: dict[str, str]) -> str:
    pt = await create_programa_tm_id(client, headers)
    s = await client.post(
        "/api/v1/sesion_threat_modelings",
        headers=headers,
        json={
            "programa_tm_id": pt,
            "fecha": "2024-03-01T10:00:00+00:00",
            "participantes": "A,B",
            "contexto": "c",
            "estado": "Completada",
            "ia_utilizada": False,
        },
    )
    assert s.status_code == 201, s.text
    return s.json()["data"]["id"]


async def create_servicio_regulado_registro_id(client: AsyncClient, headers: dict[str, str]) -> str:
    svc_id = await create_servicio_id(client, headers)
    _u()
    r = await client.post(
        "/api/v1/servicio_regulado_registros",
        headers=headers,
        json={
            "servicio_id": svc_id,
            "nombre_regulacion": "CNBV",
            "ciclo": "Q1",
            "ano": 2024,
            "estado": "Pendiente",
        },
    )
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


async def create_regulacion_control_id(client: AsyncClient, headers: dict[str, str]) -> str:
    x = _u()
    rc = await client.post(
        "/api/v1/regulacion_controls",
        headers=headers,
        json={
            "nombre_regulacion": "CNBV",
            "nombre_control": f"AC-{x}",
            "descripcion": "d",
            "obligatorio": True,
        },
    )
    assert rc.status_code == 201, rc.text
    return rc.json()["data"]["id"]


async def create_programa_source_code_id(client: AsyncClient, headers: dict[str, str]) -> str:
    repo_id = await create_repositorio_id(client, headers)
    x = _u()
    p = await client.post(
        "/api/v1/programa_source_codes",
        headers=headers,
        json={
            "nombre": f"SC {x}",
            "ano": 2024,
            "descripcion": "t",
            "repositorio_id": repo_id,
            "estado": "Activo",
        },
    )
    assert p.status_code == 201, p.text
    return p.json()["data"]["id"]


async def create_control_source_code_id(client: AsyncClient, headers: dict[str, str]) -> str:
    x = _u()
    c = await client.post(
        "/api/v1/control_source_codes",
        headers=headers,
        json={
            "nombre": f"Ctl {x}",
            "tipo": "Branch Protection",
            "descripcion": "d",
            "obligatorio": True,
        },
    )
    assert c.status_code == 201, c.text
    return c.json()["data"]["id"]
