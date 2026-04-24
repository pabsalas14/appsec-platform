# Backlog — pantallas tipo listado (placeholder `JSON.stringify`)

*Generado automáticamente; actualizar al migrar a tabla + CRUD según Fase A del [PLAN_CUMPLIMIENTO_100_BRD](PLAN_CUMPLIMIENTO_100_BRD.md).*

**Referencia de implementación (jerarquía org):** `subdireccions/`, `gerencias/`, `organizacions/`, `celulas/` — búsqueda, tabla, crear/editar/eliminar, FKs en formulario.

**Inventario BRD §3.2–3.3:** `repositorios/` y `activo_webs/` — tabla, filtros por jerarquía, célula en formulario, CRUD; navegación en barra lateral (sección «Inventario (BRD)») y palette (Ctrl+K).

**Entrega y plan:** `servicios/` · `service_releases/` · `etapa_releases/` (etapas y estados al API) · `pipeline_releases/` (SAST/DAST/SCA, repositorio + liberación opcional) · `iniciativas/` — CRUD donde aplica, sección «Entrega y plan (BRD)» en la barra y palette.

**Estado (2026-04-24):** resueltos los listados con `JSON.stringify` bajo `frontend/src/app/(dashboard)/**/page.tsx`. Enfoque unificado: `PageWrapper` / `PageHeader`, búsqueda en cliente, `DataTable` (columnas principales + `updated_at` + acciones), diálogos crear/editar, eliminación con `AlertDialog`, `react-hook-form` + `zodResolver` con esquemas `*CreateSchema` en `@/lib/schemas`, hooks `@/hooks`, `toast`, `extractErrorMessage`, `formatDate`, `logger` en errores.

**Caso especial `historial_vulnerabilidads`:** el backend solo lista y crea (sin PATCH/DELETE); la UI no expone editar ni eliminar.

**Nuevos:** `hallazgo_auditorias` (ruta, sidebar sección Hallazgos, breadcrumbs, command palette) con `useAuditorias` / `useHallazgoAuditorias` y `auditoria.schema` + `hallazgo_auditoria.schema`. Utilidades compartidas opcionales: `@/components/crud` (helpers de fechas `datetime-local` ↔ ISO).
