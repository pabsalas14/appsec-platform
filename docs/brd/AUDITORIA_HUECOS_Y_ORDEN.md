# Auditoría de huecos — fases ya trabajadas + orden de implementación

**Fecha:** 2026-04-25  
**Norma:** `PLAN_CUMPLIMIENTO_100_BRD.md`, `MATRIZ_COBERTURA_BRD.md`, `Requerimientos de Negocio (BRD).md`  
**Qué cubre:** inventario **sin dejar fuera** de los requisitos por fase que ya tuvieron desarrollo; huecos remanentes; **orden** sugerido. Las fases **E, G, H** siguen detalladas en [`ANALISIS_FASES_E_G_H.md`](ANALISIS_FASES_E_G_H.md).

**Diferido explícito (no entra al orden hasta cerrar lo anterior):** mapeo formal y checklist de contenido **Dashboards 1–9** → [`MAPEO_DASHBOARDS_BRD_DIFERIDO.md`](MAPEO_DASHBOARDS_BRD_DIFERIDO.md). Tras E–G–H y cierres de esta auditoría, se retoma ese documento y la sección F1 de la matriz.

---

## 1. Criterio

- **“Fase trabajada”** = hubo entregas de producto o API documentadas en matriz/plan, aunque el estado no sea 100% BRD.  
- **Hueco** = criterio del plan o texto BRD aún en **Parcial** / no cubierto en la fila P* correspondiente.  
- Cierre 100% matriz: evidencia (tests, pantalla, export, acta) según `PLAN` §1.

---

## 2. Fase A — Catálogos, inventario, gobierno (§2–3) → P1–P3

| ID plan | Estado en matriz | Huecos (si aplica) |
|--------|-------------------|---------------------|
| A1 | P3 **Hecho** | Ninguno crítico: CRUD homogéneo con tabla, búsqueda, paginación, orden en catálogos/inventario §3. |
| A2 | P3 **Hecho** | Import+template+CSV donde aplica; **revisar** si algún sub-catálogo del BRD §3.4 queda sin import (extensión incremental). |
| A3 | P3 **Hecho** | Export CSV alineado; idem revisión de cobertura total de entidades. |
| A4 | P3 **Hecho** | Cadena org en pruebas; mantener al añadir entidades. |
| (transversal) | P1 **Parcial** | Plataforma unificada: mismo estándar de calidad en **todos** los módulos (depende de cerrar P7–P12 y P19–P21). |
| (transversal) | P2 **Parcial** | **Schema dinámico / Schema Builder** al nivel BRD: no alcanzado; requiere ADR o acuerdo de alcance (ver plan §4). |

**Orden sugerido para remanentes A:** validación puntual A2/A3 faltante (si al auditar el BRD §3.4 faltan entidades) → dejar P2 como decisión de alcance explícita en matriz.

---

## 3. Fase B — Programas y scoring (§4–5) → P4–P6

| ID | Estado | Huecos |
|----|--------|--------|
| B1 | P4 **Hecho** | Ninguno funcional; mantener al cambiar `scoring.*`. |
| B2 | P4 **Hecho** | Idem. |
| B3 | P5 **Hecho** | Idem. |
| B4 | P6 **Hecho** | Idem. |

**Remanentes BRD en §5 (no B1–B4 estrictos):** cubiertos por P7–P9 (Código fuente, regulados, MAST) — ver §6.

---

## 4. Fase C — Operación, pipeline, match (§10) → P13–P15

| ID | Estado | Huecos |
|----|--------|--------|
| C1 | P13 **Hecho\*** | Formularios liberación: **homogeneizar** todos los campos con API; E2E si negocio lo exige. |
| C2 | P14 **Hecho\*** | **P14 matices:** SCA / empresa única, data quality en match (no bloquea E/G/H). |
| C3 | P15 (contexto C) en P13 | Kanban: columnas en settings; **OK en espíritu**. |

---

## 5. Fase D — Vulnerabilidades (§11) → P16

| ID | Estado | Huecos |
|----|--------|--------|
| D1 | P16 **Hecho\*** | (Opcional) E2E admin flujo de estatus. |
| D2 | P16 **Hecho\*** | Reglas en **exportaciones/ PDF** si el BRD las exige explícitamente; hoy: dashboard + tooltips. |

---

## 6. Módulos BRD cubiertos fuera de “C/D” (huecos P7–P12)

Fases con desarrollo parcial, no listados en la tabla C/D del plan como bloque único:

| Fila | § BRD | Huecos principales (sin omitir) |
|------|--------|----------------------------------|
| P7 | §5.4 Código fuente | Checklists y cierre operativo según frentes. |
| P8 | §5.5 Servicios regulados | Cierre **multi-jefatura** según narrativa. |
| P9 | §6 MAST | UI y “schema” al alcance BRD. |
| P10 | §7 Iniciativas | Actividades y scoring integrados con §4 en **UI**. |
| P11 | §8 Auditorías | Requisitos, fechas, cierre al detalle BRD. |
| P12 | §9 Temas emergentes | Bitácora, actividades, **filtros §9** al completo. |

---

## 7. Fase F — Dashboards y drill-down (§13) → P19–P21

*El **mapeo formal 1–9 + checklist de contenido** va en [`MAPEO_DASHBOARDS_BRD_DIFERIDO.md`](MAPEO_DASHBOARDS_BRD_DIFERIDO.md) — no se exige completarlo antes del orden de la §9.*

| ID | Estado | Huecos |
|----|--------|--------|
| F1 | P21 **Parcial** | Contenido BRD: **heatmaps**, tendencias multi-periodo, comparativas; hub ≠ reemplazo de D5–9. |
| F2 | P19 **Parcial** | E2E home → filtro → módulo (si se pide 100% UX). |
| F3 | P20 **Parcial** | Mismo patrón **filtros server-side + URL** en: liberaciones, iniciativas, programas, temas, etc. (hoy **vulnerabilidades** adelantado). |
| F4 | P19 | Smoke E2E **links** en paneles / dashboards. |

---

## 8. P22–P24 (G + IA) — alineado con fases G y análisis E/G/H

| Fila | Contenido | Dónde detallar |
|------|-----------|----------------|
| P22 | Umbrales §14.3, etc. | `ANALISIS_FASES_E_G_H.md` §3 |
| P23 | Plantillas reporte, historial config | idem §3.3 |
| P24 | IA E2E multi-proveedor | idem §3.4 |

---

## 9. Fases E, G, H

No se repite el detalle: ver [`ANALISIS_FASES_E_G_H.md`](ANALISIS_FASES_E_G_H.md) (motor indicadores, madurez, notificaciones automáticas, G3, H cobertura/runbook/acta).

---

## 10. Orden de implementación global (propuesta)

Aplicar en serie salvo lo marcado *paralelizable*.

| # | Lote | Qué cierra | Depende de |
|---|------|------------|------------|
| 1 | **E1.2 + E1.3** (motor fórmulas + API resultados) | P17, base para P18 | — |
| 2 | **E1.1 + E1.4 + E1.5** | Seeds XXX-*, UI, E2E indicadores | 1 |
| 3 | **E2** (madurez roll-up + UI/export + tests) | P18 | 1 (y idealmente 2) |
| 4 | **G2** (reglas §14.3 + preferencias + pruebas) | P22 | poco (paralelizable a 2–3) |
| 5 | **G3** (plantillas reporte, auditoría de config) | P23 | 4 (opcional) |
| 6 | **G1** reforzado (matriz documentada permisos + tests) | P22 inicio | — |
| 7 | **G4** (E2E IA multi-proveedor) | P24 | 5 *opcional* |
| 8 | **H** (cobertura acordada, runbook, performance medida, acta) | cierre calidad | 1–7 según criterio |
| 9 | **C/D remanentes** (C1 UI, P14 data quality) | P13–P14 | baja prioridad vs E |
| 10 | **F3** homogéneo (resto módulos) | P19–P20 | 8 deseable (no regresión) |
| 11 | **F1/F4** (heatmaps, E2E links, tendencias) | P21, P19 | 10 *opcional* |
| 12 | **P7–P12** (según prioridad de negocio) | cierre módulos satélite | 10 donde comparta listados |
| 13 | **Diferido** | [`MAPEO_DASHBOARDS_BRD_DIFERIDO.md`](MAPEO_DASHBOARDS_BRD_DIFERIDO.md) completo + actualización `MATRIZ` F1 | **Tras 1–11** o según criterio de producto (no bloquea E–G–H) |

**Nota:** el orden 9–12 puede intercalar con 4–7 si el negocio prioriza “operación perfecta” antes de indicadores; el orden anterior favorece **dependencias técnicas** (motor E desbloquea P17/P18; G2/G3 poco acoplados a E).

---

## 11. Enlaces de trazabilidad

| Documento | Uso |
|-----------|-----|
| `MATRIZ_COBERTURA_BRD.md` | Estado Hecho/Parcial por P1–P24 |
| `PLAN_CUMPLIMIENTO_100_BRD.md` | Criterios por fase A–H |
| `ANALISIS_FASES_E_G_H.md` | Desglose E, G, H y remanentes C/D/F |
| `MAPEO_DASHBOARDS_BRD_DIFERIDO.md` | Mapeo 1–9 + checklist — **post-fases** |
| `docs/operations/RUNBOOK.md` | Fase H operativa |

*Actualizar este archivo al cerrar cada lote de la §10.*

---

## 12. Cierre de lotes 1–12 (2026-04-26)

Evidencia de implementación: motor de indicadores + `seed` BRD, `madurez/summary` + `export.csv`, notificaciones §14.3 (tres reglas) + `procesar-reglas`, anti-duplicado pipeline P14, listados paginados `programa_source_codes`, `GET /indicadores/.../trend|aggregate`, pruebas ampliadas, matriz G1, actualización `MATRIZ_COBERTURA_BRD.md`. **Lote 13** (mapeo D1–9) y **Fase H** (acta, performance de prod, 80% cov., cron externo) quedan según criterio de producto. **G4** (E2E IA multi-proveedor) sigue apoyada en `ia-integration.spec` y configuración `ia.proveedor_activo`.
