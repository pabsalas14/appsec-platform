# Gap analysis — P04 No-Code (ADR-0016)

**Referencia:** [`docs/adr/0016-no-code-builder-scope-brd.md`](../adr/0016-no-code-builder-scope-brd.md).

## entity_type administrables en UI (`ENTITY_TYPES`)

Lista sincronizada en [`frontend/src/lib/schemas/admin.ts`](../../frontend/src/lib/schemas/admin.ts): vulnerabilidad, repositorio, activo_web, service_release, plan_remediacion, tema_emergente, auditoria, iniciativa, hallazgo_pipeline, proyecto.

## Lectura de valores en detalle (usuario final)

- **Implementado:** `GET/PATCH /api/v1/entity-custom-fields/{entity_type}/{entity_id}` y `.../{field_id}` con `get_current_user` y comprobación de propiedad (`user_id`) sobre la entidad ADR-0016. La UI usa `EntityCustomFieldsCard` en fichas detalle y diálogos de edición donde aplica.
- Los endpoints **admin** `/api/v1/admin/custom-fields/...` siguen siendo la superficie de **definición** de campos (backoffice).

## Module Views

- Superficie [`/admin/module-views`](../../frontend/src/app/(dashboard)/admin/module-views/page.tsx): verificar que el `module_key` coincida con rutas reales por entidad prioritaria.

## Cierre

Marcar P04 como **Cumple** solo cuando: (1) lista ADR cubierta en admin, (2) evidencia de pantallas usuario o decisión explícita en este documento sobre lectura no-admin.
