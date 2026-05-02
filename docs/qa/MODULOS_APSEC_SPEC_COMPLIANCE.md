# Cumplimiento: Especificación Módulos AppSec (UX + dominio)

**Fecha:** 2026-05-02 (alineado a auditoría 24 puntos y README renovado).  
**Criterio de medición:** [`docs/adr/0017-appsec-spec-ux-criteria.md`](../adr/0017-appsec-spec-ux-criteria.md) y [`docs/adr/0016-no-code-builder-scope-brd.md`](../adr/0016-no-code-builder-scope-brd.md) donde aplica.

## Principios generales (UX Premium)

| # | Requisito | Estado | Notas |
|---|-----------|--------|--------|
| 1 | Navegación relacional (hijos bajo detalle del padre) | **Cumple** | Hubs `/inventario`, `/programas`; detalle iniciativa con pestaña de programas |
| 2 | Drawers para alta/edición/detalle | **Cumple** | `Sheet` en flujos operativos; ADR-0017 acota migración masiva Dialog→Sheet |
| 3 | Exportación WYSIWYG (Excel/PDF) en tablas | **Cumple** | XLSX/CSV + impresión; criterio ADR-0017 |
| 4 | No-Code Builder (admin) — alcance BRD | **Cumple** | ADR-0016 — lista cerrada de `entity_type` + Module Views + API entity fields |
| 5 | Filtros compactos + chips | **Cumple** | Patrón URL + chips en módulos prioritarios |
| 6 | Validación en tiempo real (formularios) | **Cumple** | Zod + RHF |
| 7 | Alerta cierre con cambios no guardados | **Cumple** | `useUnsavedChanges` en formularios priorizados (ADR-0017 cobertura gradual) |
| 8 | Importación con plantilla "Descargar template" | **Cumple** | Catálogos + import vulnerabilidades por motor (pestañas) |

## 1. Organización (jerarquía)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Vista árbol / tabla jerárquica | **Cumple** | `/organizacion/jerarquia` |
| Columnas: Nombre, Nivel, Responsable, Repos, Madurez | **Cumple** | Madurez vía `/madurez/node-scores` + UI |
| Panel lateral con campos | **Cumple** | Rutas por entidad + jerarquía (ADR-0017) |
| Validación padre-hijo | **Cumple** | Backend + tests ownership (`gerencias`, `organizacions`, …) |

## 2. Inventario (repositorios y activos web)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Pestañas Repositorios \| Activos web | **Cumple** | `/inventario` |
| Filtros y columnas según spec | **Cumple** | Tablas alineadas a dominio/API (ADR-0017) |
| Detalle activo: Info / Vulns / Historial escaneos | **Cumple** | `/activo_webs/[id]` con historial de pipelines |

## 3. Vulnerabilidades

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Filtros amplios (org, fechas, SLA, reincidencia…) | **Cumple** | Incl. `celula_id` / `organizacion_id` en API y UI |
| Columnas BRD | **Cumple** | Tabla registros completa |
| Detalle en panel lateral | **Cumple** | Sheet + ficha |
| Campos importación por motor | **Cumple** | Pestañas por motor + CSV |

## 4. Operación (liberaciones y pipeline)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Liberaciones: tabla + kanban, filtros | **Cumple** | Dashboards + CRUD |
| Pipeline SAST/DAST: tabla, match Scan ID + rama | **Cumple** | Modelo + UI + config operación; orden kanban desde settings |

## 5. Programas anuales e iniciativas

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Pestañas programas \| iniciativas, detalle, actividades | **Cumple** | `/programas`, `/dashboards/programs`, detalle iniciativa con pestañas |

## 6. Temas emergentes y auditorías

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Pestañas, filtros, campos de captura | **Cumple** | Páginas + OpenAPI + smoke test de contrato |

## 7. Desempeño (OKR)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Pestañas, cascada, Q-review, semáforos | **Cumple** | `/okr_dashboard` y registros OKR (ADR-0017) |

## 8. Administración (No-Code)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Usuarios, roles, permisos | **Cumple** | Admin |
| Catálogos, campos, flujos, plantillas export, audit, umbrales | **Cumple** | Alcance acotado ADR-0016 / 0017 |
