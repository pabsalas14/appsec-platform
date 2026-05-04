# Auditoría visual — dashboards y superficie AppSec (frontend)

**Fecha:** 2026-05-02  
**Alcance:** `frontend/src/app/(dashboard)/dashboards/**/*.tsx` y páginas relacionadas (shell compartido bajo `(dashboard)`).  
**Objetivo:** visibilidad sobre **homogeneidad** de color, tipografía y patrones de layout **sin** cambiar funcionalidad en esta entrega.

---

## Decisión y cierre (2026-05-02)

Se adoptó el contrato visual **«dark ops»** documentado en **[ADR-0018](../adr/0018-dashboard-dark-ops-visual-contract.md)**:

- Variables CSS `--dashboard-*` en `globals.css` y mapeo Tailwind `dashboard.*`.
- Hook **`useDashboardChartTheme`** para Recharts (grid, ejes, tooltip) alineados al tema.
- Páginas migradas a tokens de layout: **kanban**, **vulnerabilities**, **releases**, **emerging-themes** (sin hex para fondos/bordes salvo colores **puramente semánticos de datos** en charts/filtros).

**Criterio de cierre para nuevos dashboards:** no introducir hex de layout; usar `dashboard.*` + utilidades documentadas; datos codificados por color pueden usar paletas fijas explícitas.

---

## Metodología (histórica)

1. Revisión estática de clases Tailwind: uso de **tokens semánticos** (`bg-card`, `text-muted-foreground`, `border`, variables CSS del tema) vs **hex fijos** (`#141728`, `#252a45`, `#e8365d`, etc.).
2. Muestreo de páginas representativas: índice `/dashboards`, ejecutivo, vulnerabilidades, kanban, programas, OKR embebido.
3. Comparación con componentes compartidos (`@/components/ui`, `@/components/charts`) descritos en ADR-0008.

---

## Hallazgo principal (resuelto por ADR-0018)

Antes coexistían dos estilos: **design system (tema)** vs **UI con hex fijos**. La migración a tokens `--dashboard-*` unifica la cromática de superficie manteniendo semántica de datos donde corresponde.

---

## Detalle por área (actualizado)

| Ruta / página | Estilo dominante | Notas |
|---------------|------------------|--------|
| `/dashboards` (índice hub) | A | Enlaces y tarjetas alineadas al shell |
| `/dashboards/executive` | Mix A/B | KPIs; revisar si quedan hex sueltos en gráficos |
| `/dashboards/vulnerabilities` | Tokens dashboard + datos | Recharts vía `chartTheme`; series/severity/motor pueden usar colores de datos |
| `/dashboards/kanban` | Tokens dashboard | Kanban + Sheet al contrato ADR-0018 |
| `/dashboards/programs` | Mix | Heatmaps y paletas por tipo (`PROGRAM_COLORS`) — aceptable por semántica de datos |
| `/dashboards/releases` | Tokens dashboard | Tabla + filtros migrados |
| `/dashboards/emerging-themes` | Tokens dashboard | KPIs + tablas migrados |
| `/dashboards/team` | A | Premium team dashboard |
| `/dashboards/concentrado` | Revisar | Variante «concentrado» de hallazgos |
| `/okr_dashboard` | A | OKR drill-down, semáforos |

---

## Recomendaciones residuales

1. **Executive / concentrado:** grep `#` y alinear layout al mismo contrato si aparecen hex de superficie.
2. **Tipografía:** donde aún exista `text-[9px]`/`text-[10px]` masivo, valorar sustitución gradual por `dashboard-section-label` / `text-xs` según jerarquía.

---

## Conclusión

Los tableros prioritarios pasan a **un solo contrato visual** (ADR-0018) integrable con el shell (ADR-0008). La homogeneización global puede continuar archivo a archivo sin nuevos hex de layout.
