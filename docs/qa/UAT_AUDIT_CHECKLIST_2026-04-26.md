# Auditoría UAT/Staging — AppSec Platform (2026-04-26)

Premisa: **“si no está probado contra casos adversos y con datos realistas, no está terminado”**.

> Nota de entorno: esta evidencia se genera contra el **stack UAT/local en Docker Compose** (postgres/backend/frontend/nginx). Para marcar “✅ CUMPLE” en UAT real, se requiere repetir los mismos pasos contra el endpoint/credenciales del ambiente Staging/UAT.

**Decisiones fijadas (qué aceptamos y qué va “más adelante”):** ver [`docs/qa/DECISIONES_UAT.md`](DECISIONES_UAT.md).  
**Volumen 5.000 vulnerabilidades (una sola vez, base desechable):** `make clean` → `make up` → `make seed` → `make seed-uat-volumen` (implementación: `backend/app/seeds/seed_uat_volume.py`).

## Evidencia clave generada en esta corrida

- **Auditoría de código (2026-04-26, sesión QA)**
  - **Catálogos hardcodeados (muestra):** listas fijas en UI p. ej. `PLATFORMS` en `frontend/src/app/(dashboard)/repositorios/page.tsx`, `ESTADOS_TEMA` / `ESTADOS_AUDITORIA` en registros de Temas/Auditorías, `SEVERIDAD_OPTS` en `vulnerabilidads/registros`, umbrales OKR en `frontend/src/lib/okr/semaforo.ts` (`OKR_SEMAFORO_UMBRAL`).
  - **IDOR / uploads (backend):** `docker compose exec -e PYTEST_ALLOW_ANY_DB=1 backend python -m pytest tests/test_uploads.py tests/test_ownership.py` → **56 passed** (tras ajustar fixtures de `repositorios` a `organizacion_id` requerido).
  - **Subida con magic numbers:** `backend/app/api/v1/uploads.py` (`_validate_magic_numbers` + `ALLOWED_CONTENT_TYPES`); tests en `tests/test_uploads.py`.
  - **Evidencia de remediación (vulnerabilidades):** `POST /evidencia-remediaciones` acepta metadatos + hash; **no** reemplaza el pipeline de multipart de `/uploads` — validar MIME en flujo real según use el cliente.
  - **beforeunload / cambios sin guardar:** sin coincidencias en `frontend/src` (`rg beforeunload` → vacío).
  - **Carga k6 / seed 5k vulns / N+1 con 100 usuarios:** no ejecutado en esta sesión (requiere Staging + herramientas y datos).

- **Fix de drift de esquema (SoftDeleteMixin / `deleted_by`)**
  - Migración correctiva: `backend/alembic/versions/g2h3i4j5k6l7_add_missing_deleted_by_columns.py`
  - Verificación en Postgres: query `information_schema` devolvió **0 tablas** con `deleted_at` sin `deleted_by` (pre-fix devolvía 5).
- **Runner E2E Playwright (Ubuntu/glibc)**
  - Compose: `docker-compose.e2e.yml`
  - Make target: `Makefile` (`make test-e2e`)
  - Motivo: `frontend` usa `node:alpine` (musl) y Playwright browsers (glibc) fallan con `ENOENT`.
- **Reset opcional de password admin para E2E reproducibles**
  - Setting: `backend/app/config.py` (`SEED_FORCE_ADMIN_PASSWORD`)
  - Seed: `backend/app/seed.py` (resetea password de `admin` cuando se habilita el flag).

---

## Checklist (✅/❌)

### 1) Auditoría “100% Builder No-Code” (Toda la plataforma)

1.1 **Cero hardcoding de catálogos (dropdowns no quemados)**  
❌ NO CUMPLE (pendiente de verificación sistemática)  
Evidencia: aún no se ejecutó escaneo/inspección UI+API para confirmar que *todas* las listas vienen de catálogos administrables.

1.2 **Schema Builder dinámico (prueba cruzada: 3 módulos)**  
❌ NO CUMPLE (no verificado en UI)  
Evidencia: runner E2E quedó en estabilización; falta flujo: crear campo en Admin → verificar forms y tablas sin tocar código.

1.3 **Jerarquía dinámica universal (cambio de “reporta a” + cascadas)**  
❌ NO CUMPLE (no verificado)  
Evidencia: falta prueba con datos y recalculo inmediato (compromisos/vulns).

1.4 **Reglas de negocio configurables (umbrales, SLAs, pesos)**  
❌ NO CUMPLE (no verificado)  
Evidencia: falta validación end-to-end desde UI de settings/catálogos vs constantes en código.

### 2) Navegación y Arquitectura de Información

2.1 **Agrupación lógica del menú (secciones colapsables)**  
❌ NO CUMPLE (no verificado con evidencia UI)  
Evidencia: requiere captura de Sidebar con secciones + config desde Navigation Builder.

2.2 **Regla de los 2 clics (Tema Emergente / detalle Vulnerabilidad)**  
❌ NO CUMPLE (no verificado con navegación real)  
Evidencia: requiere recorrido UI + capturas.

2.3 **Breadcrumbs clickeables (drill-down nivel 4 dashboard vulnerabilidades)**  
❌ NO CUMPLE (no verificado)  
Evidencia: requiere navegación dashboard + capturas.

### 3) Filtros, Exportaciones y Plantillas (NUEVO)

3.1 **Filtros contextuales + paginación recalculada (5,000 registros)**  
❌ NO CUMPLE (E2E bloqueado / datos masivos no sembrados aún)  
Evidencia: suite Playwright requiere estabilización + seed masivo realista.

3.2 **Exportación WYSIWYG (respeta filtros y columnas visibles)**  
❌ NO CUMPLE (no verificado end-to-end)  
Evidencia: falta E2E + comparación de dataset exportado vs UI.

3.3 **Plantillas configurables de exportación (Temas Emergentes)**  
❌ NO CUMPLE (no verificado en UI)  
Evidencia: falta cambiar plantilla en Admin y re-exportar.

3.4 **Buscador global vs contextual (parcial, búsqueda parcial)**  
❌ NO CUMPLE (no verificado)  
Evidencia: falta prueba en módulo Auditorías (ej. “PCI” → “PCI-DSS 2026”).

### 4) Integridad de Datos y Performance

4.1 **Cero mocks (datos desde BD real, sin JSONs/arrays estáticos)**  
❌ NO CUMPLE (pendiente escaneo)  
Evidencia: falta auditoría estática (rg) + verificación runtime.

4.2 **Performance (N+1 queries en dashboards con 100 usuarios / 5,000 vulns)**  
❌ NO CUMPLE (no medido)  
Evidencia: falta instrumentación/inspección de queries por request.

4.3 **Paginación/Lazy loading (tablas >2s no aceptables)**  
❌ NO CUMPLE (no medido)  
Evidencia: falta E2E + medición perf con dataset realista.

### 5) Seguridad y Casos Adversos

5.1 **IDOR (cambiar ID en URL no debe exponer recursos)**  
✅ CUMPLE (por diseño devuelve **404** para evitar “oracle”, no 403)  
Evidencia: subset de tests de ownership/IDOR pasó en backend (`tests/test_ownership.py` para `direccions`, `celulas`, `repositorios`, `activo_webs`, `servicios`, `aplicacion_movils`).  
Nota: checklist solicitaba 403; el framework usa 404 deliberadamente (ADR-0004).

5.2 **Ataque de carga de archivos (validar MIME real / Magic Numbers)**  
✅ CUMPLE (validación por Magic Numbers en backend)  
Evidencia: `backend/app/api/v1/uploads.py` valida firmas (PDF/imagenes/zip + tipos texto estrictos). Test: `backend/tests/test_uploads.py::test_upload_rejects_pdf_with_wrong_magic_number` (rechaza script/EXE renombrado a `.pdf`).

5.3 **Concurrencia (race condition, optimistic locking)**  
❌ NO CUMPLE (no verificado)  
Evidencia: falta prueba concurrente y/o soporte de versionado (`updated_at`/`row_version`) por entidad crítica.

5.4 **Inmutabilidad por API (Q cerrado / Audit logs no modificables)**  
❌ NO CUMPLE (no verificado)  
Evidencia: falta tests que intenten mutar recursos cerrados y audit_logs.

5.5 **CSRF doble-submit en mutaciones autenticadas por cookie**  
✅ CUMPLE (según suite contractual backend)  
Evidencia: `backend/tests/test_contract.py::test_cookie_mutations_require_csrf` y `backend/tests/test_auth.py::test_cookie_mutation_requires_csrf` pasan cuando la suite corre con esquema consistente.

### 6) UX, Notificaciones y Prevención de Errores

6.1 **Confirmaciones destructivas (modal antes de acciones críticas)**  
❌ NO CUMPLE (no verificado en UI)  
Evidencia: falta E2E con capturas (rechazar/close/delete/aceptar riesgo/cancelar release).

6.2 **Prevención pérdida de datos (alerta “cambios sin guardar”)**  
❌ NO CUMPLE (no verificado)  
Evidencia: falta E2E con navigation away / close tab simulation.

6.3 **Motor de notificaciones universal (4 disparadores)**  
❌ NO CUMPLE (no verificado)  
Evidencia: falta seed + runner de reglas + verificación in-app/email.

6.4 **Importación estandarizada (descargar template con headers exactas)**  
❌ NO CUMPLE (no verificado)  
Evidencia: falta E2E en pantallas con “Importar masivamente”.

### 7) Trazabilidad (Audit Trail)

7.1 **Logs de auditoría inmutables (quién/cuándo/antes/después)**  
❌ NO CUMPLE (no verificado end-to-end)  
Evidencia: existen tests de audit log, pero falta ejecutar el set de acciones UI y validar “valor anterior/nuevo” visible para Admin.

7.2 **Historial de evidencias (no sobrescribir archivo, mantener versiones)**  
❌ NO CUMPLE (no verificado)  
Evidencia: falta prueba de versionado/retención en evidencia por módulo.

### 8) Go-Live: Carga + Coherencia Matemática

8.1 **Prueba de carga (k6/Locust 50 analistas / 5 min / <1.5s avg)**  
❌ NO CUMPLE (no ejecutada)  
Evidencia: falta script de carga + ejecución + métricas.

8.2 **Seed realista + validación matemática de 10 dashboards (sin discrepancias)**  
❌ NO CUMPLE (no ejecutada)  
Evidencia: falta seed masivo (5,000 vulns) + checklist de sumatorias/drill-down.
