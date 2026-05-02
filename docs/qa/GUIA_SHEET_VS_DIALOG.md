# Guía: Sheet vs Dialog para alta/edición (P02)

**Objetivo:** homogeneizar patrones UX sin romper AGENTS ni ownership.

| Patrón | Cuándo usarlo |
|--------|----------------|
| **`Sheet` (panel lateral)** | Formularios largos, vista previa paralela al listado, flujos tipo “registros” con tabla visible (p. ej. vulnerabilidades). |
| **`Dialog` (modal centrado)** | Formularios cortos (≤ ~8 campos), confirmaciones, catálogos simples donde el foco debe ser exclusivo. |

**Migración recomendada:** priorizar `Sheet` en listados con tabla densa; mantener `Dialog` en seeds/catálogos hasta migración por lote.

**No guardado:** combinar con `useUnsavedChanges(form.formState.isDirty)` en el formulario envuelto.
