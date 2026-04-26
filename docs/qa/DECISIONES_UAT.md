# Decisiones fijadas — QA / UAT (AppSec Platform)

Objetivo: cerrar ambigüedades del checklist de auditoría y separar **lo que se acepta como criterio de producto** de **lo que queda en backlog** (fases posteriores).

Fecha: 2026-04-26

---

## 1. Seguridad

| Tema | Decisión |
|------|-----------|
| **IDOR: 403 vs 404** | Se mantiene **404** ante acceso a recurso ajeno, para no actuar como *oracle* de existencia. Documentado en `tests/test_ownership.py` y alineado con ADR-0004. Si un cliente de seguridad exige explícitamente 403, sería un **cambio de contrato** (nuevo ADR + ajuste de tests). |
| **Subida de archivos (evidencias “JSON” vs multipart)** | **Regla de oro:** el flujo con bytes reales debe pasar por `POST /uploads` (magic numbers + allowlist). Los endpoints que solo guardan `sha256`/`filename` requieren que el producto exija *upload* previo; eso se aborda en fases futuras, no se simula en el checklist. |
| **Carga de volumen** | Se permite **un solo** seed masivo de 5.000 vulnerabilidades **solo** en base **desechable**, con `SEED_UAT_VOLUME=1` (ver `make seed-uat-volumen`). Nunca en producción ni en una DB compartida sin snapshot/restore. |

---

## 2. Arquitectura “100% builder”

| Tema | Decisión |
|------|-----------|
| **Catálogos 100% sin hardcode** | **Objetivo de madurez**, no bloqueo de un solo sprint. Criterio: priorizar módulos “alto tráfico” (vulnerabilidades, inventario, estatus) hacia `catalog` / settings, y dejar *kitchen-sink* y demos con opciones fijas. |
| **Umbrales (semáforo OKR 85% / 70%)** | Mientras haya constantes en `frontend/src/lib/okr/semaforo.ts`, el “100% admin UI” **no** se declara alcanzado. Migración: settings JSON + lectura única en backend. **Backlog fase 2+.** |
| **k6 / Locust 50 usuarios 5 min** | **Fase de hardening** posterior al seed de volumen y a una pasada de optimización de queries. Requiere entorno aislado y orquestación; no se mezcla con el flujo de desarrollo diario. |

---

## 3. Backlog explícito (más adelante)

- Optimistic locking en entidades con flujo de aprobación.
- `beforeunload` / guardas de “cambios sin guardar” en formularios largos.
- Pruebas E2E con captura por módulo (destructivas, importaciones).
- Coherencia matemática automática: tests de agregación cruzada para los 10 dashboards.
- Diffs “valor anterior / nuevo” en `audit_log` visibles en UI admin.

Cada ítem con **Definición de Done** y **evidencia** (test, log, o captura) antes de marcar CUMPLE en el checklist.

---

## 4. Comandos (volumen, una sola vez)

1. `make clean` (solo si la base es desechable)  
2. `make up`  
3. `make seed`  
4. `make seed-uat-volumen`  

Validación rápida en SQL (opcional): contar filas con `titulo` como `[DEMO-VOL] UAT carga —%` y `severidad` agrupada.
