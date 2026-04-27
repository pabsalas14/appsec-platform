# Cumplimiento: Especificación Módulos AppSec (UX + dominio)

Fecha: 2026-04-26. Objetivo: mapear la especificación "Módulos AppSec" frente a la implementación y registrar brechas aceptables vs backlog.

## Principios generales (UX Premium)

| # | Requisito | Estado | Notas |
|---|-----------|--------|--------|
| 1 | Navegación relacional (hijos bajo detalle del padre) | Parcial | Varios módulos usan listas + detalle; actividades de programa requieren validar drill en `programa` / pipelines |
| 2 | Drawers para alta/edición/detalle | Parcial | `Sheet` usado en dashboard equipo; listado vulnerabilidades: panel lateral añadido en `vulnerabilidads/registros`; muchos catálogos aún usan `Dialog` |
| 3 | Exportación WYSIWYG (Excel/PDF) en tablas | Parcial | `lib/export.ts` (CSV/XLSX); `CatalogCsvToolbar` en catálogos; PDF vía impresión del navegador en puntos clave; no plantillas admin WYSIWYG |
| 4 | 100% No-Code Builder (admin) | Parcial | Existen: catálogos, custom fields, flujos en settings, fórmulas, module views — cobertura no es 100% de todos los módulos |
| 5 | Filtros compactos + chips | En curso | Patrón aplicado al catálogo de vulnerabilidades; replicar en otros módulos prioritarios |
| 6 | Validación en tiempo real (formularios) | Sí (mayoría) | Zod + `react-hook-form` en scaffolds |
| 7 | Alerta cierre con cambios no guardados | Bajo | No transversal; conviene hook `useUnsavedChanges` + confirm en `Sheet`/`Dialog` |
| 8 | Importación con plantilla "Descargar template" | Sí (catálogos) | `CatalogCsvToolbar` + endpoints `import-template.csv` |

## 1. Organización (jerarquía)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Vista árbol / tabla jerárquica | **Mejorado** | Ruta dedicada: `/organizacion/jerarquia` (árbol colapsable) además de CRUD por entidad |
| Columnas: Nombre, Nivel, Responsable, Repos, Madurez | **Parcial** | Responsable según entidad; repos agregados por célula; score madurez como placeholder hasta modelo/métrica |
| Panel lateral con campos (Nivel, Padre, Plataforma, URL…) | Parcial | Formularios existen en páginas por entidad; unificación en un solo drawer no implementada |
| Validación padre-hijo | Backend/servicio | Reglas de pertenencia en creación; revisar en cada entidad |

## 2. Inventario (repositorios y activos web)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Pestañas Repositorios \| Activos web | **Añadido** | Hub unificado: `/inventario` con pestañas y enlaces a módulos existentes |
| Filtros y columnas según spec | Parcial | `repositorios` y `activo_webs` con tablas; alinear nombres de columnas de forma incremental |
| Detalle activo: tabs Info / Vulns / Historial escaneos | Parcial | Existe detalle; historial de escaneos depende de `pipeline` / hallazgos — revisar ruta `activo_webs/[id]` |

## 3. Vulnerabilidades

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Filtros amplios (org, fechas, SLA, reincidencia…) | Parcial | URL filters + `useUrlFilters`; org jerárquica en list API si está expuesta; motores **CDS/MDA** en API (`FUENTES_VALIDAS`) y en el selector del listado |
| Columnas: ID, motor, severidad, activo, fechas, SLA, estatus | **Mejorado** | Tabla de registros ampliada; SLA derivado de `fecha_limite_sla` |
| Detalle en panel lateral | **Añadido** | Vista rápida en `Sheet` + enlace a página completa |
| Campos importación por motor (SAST, SCA, …) | Parcial | `custom_fields` JSONB + importadores; mapeo columna a columna según conector, no toda la matriz en UI |

## 4. Operación (liberaciones y pipeline)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Liberaciones: tabla + kanban, filtros | Sí (dashboards + CRUD) | Alinear labels de estatus con Jira/BRD de forma continua |
| Pipeline SAST/DAST: tabla, match Scan ID + rama | Parcial | Modelo `PipelineRelease` / hallazgos; lógica de match en servicios o jobs |

## 5. Programas anuales e iniciativas

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Pestañas programas \| iniciativas, detalle, actividades en drawer | Parcial | Páginas y dashboards; unificación UX pendiente de producto |

## 6. Temas emergentes y auditorías

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Pestañas, filtros, campos de captura | Sí (modelos + páginas) | Validar cada campo de la spec frente a schema Zod |

## 7. Desempeño (OKR)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Pestañas, cascada, Q-review, semáforos | Parcial | Módulo OKR + `/okr_dashboard`; alinear textos y flujos con spec de aprobación |

## 8. Administración (No-Code)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Usuarios, roles, permisos | Sí | Admin |
| Catálogos, campos, flujos, plantillas export, audit, umbrales | Parcial | Varios módulos bajo `/admin/*`; plantillas PDF WYSIWYG = backlog explícito |

---
**Próximos pasos sugeridos:** (1) Replicar patrón filtros+chips+export en `service_releases` y `repositorios`. (2) `useUnsavedChanges` en formularios de `Dialog`/`Sheet`. (3) Unificar actividades bajo detalle de programa. (4) Completar plantillas de exportación administradas.
