"""
Fase H — criterios de rendimiento (10k filas, timeouts).

`pytest tests/test_phase_h_import_perf.py` se omite salvo `RUN_PERF_TESTS=1`.
En CI, ejecutar solo cuando haya un entorno dedicado: la carga mínima mide
que el import no revienta en un CSV moderado.
"""

import io
import os
import time

import pytest
from httpx import AsyncClient

RUN_PERF = os.environ.get("RUN_PERF_TESTS") == "1"

pytestmark = pytest.mark.skipif(not RUN_PERF, reason="RUN_PERF_TESTS=1 to enable perf smoke")

BASE = "/api/v1/hallazgo_pipelines"


def _csvr(scan: str, branch: str, n: int) -> str:
    lines = ["scan_id,branch,titulo,severidad,archivo,linea,regla,estado"]
    for i in range(n):
        lines.append(f"{scan},{branch},H{i},Alta,s.py,{i},r{i},Abierto")
    return "\n".join(lines) + "\n"


@pytest.mark.asyncio
async def test_hallazgo_pipeline_import_10k_no_timeout(
    client: AsyncClient, auth_headers: dict[str, str]
):
    """Carga 10_000 filas: debe completar < 120s (límite defensivo; ajustar en entorno)."""
    from tests.graph_helpers import create_repositorio_id

    repo = await create_repositorio_id(client, auth_headers)
    pr = await client.post(
        "/api/v1/pipeline_releases",
        headers=auth_headers,
        json={
            "repositorio_id": repo,
            "rama": "main",
            "scan_id": f"scan-perf-{os.getpid()}",
            "tipo": "SAST",
            "resultado": "Pendiente",
        },
    )
    assert pr.status_code == 201, pr.text
    det = await client.get(f"/api/v1/pipeline_releases/{pr.json()['data']['id']}", headers=auth_headers)
    rama = det.json()["data"]["rama"]
    scan = det.json()["data"].get("scan_id") or "scan-e2e-pipeline"
    body = _csvr(scan, rama, 10_000)
    t0 = time.perf_counter()
    r = await client.post(
        f"{BASE}/import-csv",
        headers=auth_headers,
        files={"file": ("big.csv", io.BytesIO(body.encode("utf-8")), "text/csv")},
        timeout=300.0,
    )
    elapsed = time.perf_counter() - t0
    assert r.status_code == 201, r.text[:2000]
    assert r.json()["data"]["importados"] == 10_000
    assert elapsed < 120.0, f"import took {elapsed:.1f}s (expected <120s)"
