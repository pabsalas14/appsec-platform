# Auditoría visual — dashboards y superficie AppSec (frontend)

**Fecha:** 2026-05-02  
**Alcance:** `frontend/src/app/(dashboard)/dashboards/**/*.tsx` y páginas relacionadas (shell compartido bajo `(dashboard)`).  
**Objetivo:** visibilidad sobre **homogeneidad** de color, tipografía y patrones de layout **sin** cambiar funcionalidad en esta entrega.

---

## Metodología

1. Revisión estática de clases Tailwind: uso de **tokens semánticos** (`bg-card`, `text-muted-foreground`, `border`, variables CSS del tema) vs **hex fijos** (`#141728`, `#252a45`, `#e8365d`, etc.).
2. Muestreo de páginas representativas: índice `/dashboards`, ejecutivo, vulnerabilidades, kanban, programas, OKR embebido.
3. Comparación con componentes compartidos (`@/components/ui`, `@/components/charts`) descritos en ADR-0008.

---

## Hallazgo principal: dos “lenguajes” visuales

| Familia | Descripción | Ejemplos de rutas |
|--------|-------------|-------------------|
| **A — Design system (tema)** | `Card`, `PageHeader`, `Badge`, colores derivados de `globals.css` / `next-themes`. Coherente con sidebar y catálogos. | `/dashboards/hub`, `/dashboards/executive` (parcial), `/dashboards/programs` (partes), `/okr_dashboard` |
| **B — UI “dark ops” fija** | Fondos y bordes con **hex literales** (`bg-[#141728]`, `border-[#252a45]`), acento **magenta** `#e8365d`, texto `text-[#e2e8f0]`. Alta densidad tipográfica (`text-[10px]`, `font-black`). | `/dashboards/kanban`, `/dashboards/vulnerabilities`, tramos de paneles tipo “premium” |

**Consecuencia:** el usuario percibe **inconsistencia** entre tableros “glass/shadcn” y tableros “cyber dashboard”; no es un bug funcional, es **deuda de diseño**.

---

## Detalle por área (orientativo)

| Ruta / página | Estilo dominante | Notas |
|---------------|------------------|--------|
| `/dashboards` (índice hub) | A | Enlaces y tarjetas alineadas al shell |
| `/dashboards/executive` | Mix A/B | KPIs; revisar si quedan hex sueltos en gráficos |
| `/dashboards/vulnerabilities` | **B** fuerte | Muchos `bg-[#141728]`, `#e8365d`, Recharts con stroke hex |
| `/dashboards/kanban` | **B** fuerte | Kanban completo en paleta fija; `Sheet` lateral mismo tema |
| `/dashboards/programs` | Mix | Heatmaps y paletas por tipo de programa (`PROGRAM_COLORS`) — aceptable por semántica de datos |
| `/dashboards/releases` | Mix | Tabla + filtros; tender a A |
| `/dashboards/emerging-themes` | A tendencial | Depende de evolución reciente |
| `/dashboards/team` | A | Premium team dashboard |
| `/dashboards/concentrado` | Revisar | Variante “concentrado” de hallazgos |
| `/okr_dashboard` | A | OKR drill-down, semáforos |

---

## Recomendaciones (backlog UX; no implementadas aquí)

1. **Tokens de dashboard:** definir en CSS variables p.ej. `--dashboard-surface`, `--dashboard-border`, `--dashboard-accent` mapeadas al tema claro/oscuro.
2. **Migración gradual:** sustituir `bg-[#141728]` → `bg-muted/30` o token equivalente **por archivo**, validando contraste WCAG.
3. **Gráficos:** `components/charts` ya orientan a leer variables CSS (ADR-0008); alinear Recharts “inline” en vulnerabilities/kanban a wrappers que consuman el mismo contrato.
4. **Tipografía:** unificar jerarquía (`text-xs` / `text-sm` / `font-semibold`) y reducir mezclas `font-black` + `text-[9px]` salvo KPIs explícitos.

---

## Conclusión

La plataforma es **funcionalmente completa** en dashboards, pero **visualmente heterogénea** entre el shell AppSec y los tableros de alto contenido (vulnerabilidades, kanban). La homogeneización debe planificarse como **épica UX** (tokens + refactors mecánicos), no como cambio puntual.
