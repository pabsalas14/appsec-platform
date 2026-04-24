# Backlog — pantallas tipo listado (placeholder `JSON.stringify`)

*Generado automáticamente; actualizar al migrar a tabla + CRUD según Fase A del [PLAN_CUMPLIMIENTO_100_BRD](PLAN_CUMPLIMIENTO_100_BRD.md).*

**Referencia de implementación (jerarquía org):** `subdireccions/`, `gerencias/`, `organizacions/`, `celulas/` — búsqueda, tabla, crear/editar/eliminar, FKs en formulario.

**Inventario BRD §3.2–3.3:** `repositorios/` y `activo_webs/` — tabla, filtros por jerarquía, célula en formulario, CRUD; navegación en barra lateral (sección «Inventario (BRD)») y palette (Ctrl+K).

**Entrega y plan:** `servicios/` (FK célula, criticidad y stack) · `service_releases/` (FK `servicio_id`, estados alineados al backend) · `iniciativas/` (célula opcional, fechas) — CRUD, sección «Entrega y plan (BRD)» en la barra y palette.

Rutas aún en formato debug `JSON` (sustituir de a una o por lote, priorizando BRD §3): ver búsqueda en repo: `JSON.stringify` bajo `frontend/src/app/(dashboard)`.

Incluye (no exhaustivo): `hallazgo_*`, `programa_*`, `control_*`, etc. (excl. jerarquía, inventario §3.2–3.3, entrega y plan arriba si migrado).
