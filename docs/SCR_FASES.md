# SCR - Estado por fases (0-9)

Documento de auditoria tecnica para verificar cobertura funcional del modulo `Code Security Reviews` (SCR) con foco en malicia y aislamiento respecto a `Vulnerabilidades`.

## Paso 0 - Documento y alineacion

- `Integracion_SCR.md` actualizado como artefacto maestro de especificacion.
- Este archivo resume trazabilidad implementacion -> prueba.

## Fase 1 - Acceso GitHub dedicado SCR

- `backend/app/config.py`: `SCR_GITHUB_TOKEN`.
- `backend/app/services/scr_github_client.py`: cliente GitHub API.
- `backend/app/api/v1/scr_github.py`: orgs, repos del usuario y repos por org.

## Fase 2 - Modelo de datos SCR independiente

- Entidades: `CodeSecurityReview`, `CodeSecurityFinding`, `CodeSecurityEvent`, `CodeSecurityReport`, `CodeSecurityFindingHistory`, `CodeSecurityScanBatch`.
- Migracion: `n0o1p2q3r4s5_scr_module_tables_f0_f9.py`.
- Merge de heads: `p0q1r2s3t4u5_merge_scr_n0_with_omnisearch_f9.py`.

## Fase 3 - API CRUD + ownership + permisos

- Router `backend/app/api/v1/code_security_review.py`.
- Registro en `backend/app/api/v1/router.py`.
- Permisos `P.CODE_SECURITY.*` en `backend/app/core/permissions.py`.
- Ownership con `require_ownership` y servicios `BaseService`.

## Fase 4 - Orquestacion de analisis

- `POST /code_security_reviews/{id}/analyze` usa `BackgroundTasks`.
- `POST /code_security_reviews/batch/org` crea lote y encola todas las revisiones de la org.

## Fase 5 - Inspector (stub inicial)

- `backend/app/services/scr_agents/__init__.py` implementa salida base.
- Hallazgos persistidos en `code_security_findings` con huella unica.

## Fase 6 - Detective + Fiscal (stub inicial)

- Eventos forenses en `code_security_events`.
- Reporte ejecutivo en `code_security_reports`.
- Pipeline: `backend/app/services/scr_pipeline.py`.

## Fase 7 - Frontend dashboard SCR

- Ruta: `frontend/src/app/(dashboard)/code_security_reviews/page.tsx`.
- Hook principal: `frontend/src/hooks/useCodeSecurityReviews.ts`.
- Soporta crear revision, crear lote ORG, analizar, ver progreso y export JSON.

## Fase 8 - Export y consumo de resultados

- Endpoint `GET /code_security_reviews/{id}/export?format=json`.
- Hook/pagina contemplan descarga del bundle JSON.

## Fase 9 - Verificacion y pruebas

- Pruebas backend SCR: `backend/tests/test_code_security_review.py`.
- Ownership extendido: `backend/tests/test_ownership.py`.
- Permisos catalogo incluye codigos SCR: `backend/tests/test_fase19_permissions.py`.
- E2E baseline: `frontend/e2e/business-flows/scr-code-security-reviews.spec.ts`.
