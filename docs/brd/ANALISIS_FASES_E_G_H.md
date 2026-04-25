# Análisis de cierre al 100% — Fases E, G, H (y remanentes C / D / F)

**Fecha:** 2026-04-25  
**Norma:** `PLAN_CUMPLIMIENTO_100_BRD.md`, `MATRIZ_COBERTURA_BRD.md`, `Requerimientos de Negocio (BRD).md`  
**Regla de oro (plan §1):** “100 %” = fila de matriz en **Hecho** con **evidencia** (código, pruebas, y si hay UI, E2E o checklist de aceptación).

---

## 0. Resumen ejecutivo

| Fase | Estado global | Riesgo principal |
|------|----------------|------------------|
| **C / D / F** | Cerrados a nivel **API + prueba backend**; F con **UI** avanzada en vulnerabilidades, dashboards, hub. Quedan **matices BRD** (P7–P12, SCA, heatmaps, tablas en *todos* los módulos). | Bajo: son extensiones, no bloqueo de E/G/H. |
| **E (§12)** | **Parcial:** existe entidad y CRUD de fórmulas; **no** motor que calcule **XXX-001/001b** con datos reales, ni **madurez** por célula documentada. | Alto: sin esto, §12.1–12.2 no cumplen espíritu BRD. |
| **G (§14–16)** | **Parcial:** roles/PBAC, auditoría, notificaciones in-app **básicas**; **faltan** reglas **§14.3** (umbrales/cronos), config **§15** (plantillas PDF, historial de config), IA **E2E multi-proveedor** “oficial”. | Medio–alto. |
| **H** | `make test` / `test-cov` (≥70% en Makefile); `PERFORMANCE_OPTIMIZATION.md`; **falta** runbook operativo, meta 80% si se exige, acta de negocio. | Bajo: governance y cierre. |

**Conclusión:** alcanzar **100% literal** de todo el BRD en un solo sprint no es realista; este documento descompone el trabajo en **lotes** con criterio de aceptación verificable. Hasta no cerrar E+G+H según la tabla de abajo, el programa sigue en curso.

---

## 1. Cierre fases C, D, F (qué queda si el objetivo es “100% BRD puro”)

### 1.1 C (§10)

| ID plan | Qué pide el BRD | En repo hoy | Brecha (si aplica) |
|--------|------------------|------------|----------------------|
| C1 | Liberaciones Jira, transiciones, SLA, fechas, config operación | `service_releases` + `GET .../config/operacion` + `contexto_liberacion` + UI con Kanban (parcial) | Homogeneizar formularios con todos los campos; E2E dedicados si negocio lo exige. |
| C2 | Pipeline L1/L2, match scan/branch, import | `hallazgo_pipeline` + plantilla e import; filtros L1 | P14: matices SCA/empresa única (data quality). |
| C3 | Kanban columnas configurables | `kanban.liberacion` + admin operación | Listo en espíritu. |

### 1.2 D (§11)

| ID | BRD | En repo | Brecha |
|----|-----|---------|--------|
| D1 | Catálogo estatus 100% configurable | `catalogo.estatus_vulnerabilidad` + `GET /vulnerabilidads/config/flujo` + edición en `/admin/operacion` | Pruebas E2E de admin si exigen demo en navegador. |
| D2 | Excepción/aceptación impacta SLA y reportes | Filtro D2 en `dashboard` + tooltips UI | Reglas de negocio adicionales en **reportes exportados** si el BRD las citara explícitamente. |

### 1.3 F (§13)

| ID | BRD | En repo | Brecha |
|----|-----|---------|--------|
| F1 | 9 dashboards con contenido | 9 tableros BRD mapeados a rutas + **Hub** adicional; índice `/dashboards` | Alinear numeración 1–9 en documentación (Hub = extra, no sustituye D5–9). **Heatmaps/tendencias** aún parciales. |
| F2 | Drill-down 4 niveles + breadcrumbs | `HierarchyFiltersBar`, query en URL, `Breadcrumbs` en shell | E2E de navegación “home → filtro → módulo” si se pide 100% UX. |
| F3 | Filtros tabla §13.2 por módulo | Vulnerabilidades: API + querystring; otros módulos: mixto | Extender el mismo patrón (API paginada + URL) a **releases, iniciativas, programas, temas** donde no exista. |
| F4 | Paneles clicables | `StatCard` + `href` en home y paneles | Auditar **links rotos** con E2E de smoke por dashboard. |

**Acción inmediata si se prioriza CDF “perfecto”:** (1) matriz P19–P21 actualizada; (2) lista de módulos sin filtros server-side; (3) checklist manual Dashboard 1–9 vs `Requerimientos de Negocio (BRD).md` §13.3.

---

## 2. Fase E — Indicadores (§12.1) y score de madurez (§12.2)

### 2.1 E1 — Indicadores XXX-001, XXX-001b, … (BRD ~línea 306+)

| Entregable | Criterio plan | Estado | Trabajo necesario (sin omitir) |
|------------|---------------|--------|---------------------------------|
| **E1.1 Registro de definiciones oficiales** | Códigos y descripciones alineados al BRD | `IndicadorFormula` (CRUD) + pruebas `test_bloque_b_indicador_formula.py` | **Seed o migración de datos** con `code` = XXX-001, XXX-001b, … o script admin que las cree; hoy el CRUD es genérico. |
| **E1.2 Motor de cálculo** | “Suite de pruebas sobre datos sintéticos” | *No* hay servicio `evaluate(formula) → number` con SQL fiable | Implementar: intérprete de `formula` (JSON) con operaciones permitidas; consultas a `vulnerabilidads`/`hallazgos` por rango de fechas y jerarquía; **sin** `eval()` inseguro. |
| **E1.3 Exposición consumible** | Tableros/exports con valor auditado | No hay `GET` agregado tipo `/indicadores/resultados?period=…` o inclusión en `dashboard/executive` | Endpoint(s) o job materializado; persistencia opcional en tabla `indicador_medicion` (si se desea historial). |
| **E1.4 UI** | Visualización, no solo API | *No* hay página dedicada bajo `app/(dashboard)/` | Página `indicadores` o sección en ejecutivo; tablas con umbral verde/ámbar/rojo según `threshold_*`. |
| **E1.5 E2E** | Plan §1 | E2E `indicators-metrics.spec.ts` (parcial, muchos `skip`) | Endurecer: crear fórmula, disparar cálculo (mock o DB restringida), aserción de valor. |

### 2.2 E2 — Madurez por célula / subdirección / organización (§12.2)

| Entregable | Criterio | Estado | Trabajo |
|------------|----------|--------|---------|
| **E2.1 Modelo de dominio** | Fórmula o rubros del BRD | No hay entidad `madurez_*` clara; puede derivarse de indicadores + pesos | Definir **matriz de rubros** (config JSON o tabla); pesos en `system_settings` o `IndicadorFormula`. |
| **E2.2 Cálculo** | Mismo criterio para toda la jerarquía | N/A | Agregación por `celula_id` → `organizacion` → `gerencia` → `subdireccion` (roll-up). |
| **E2.3 UI / export** | “Vistas o exports con cálculo auditado” | No hay vista dedicada | Página bajo `dashboards` o módulo “Madurez”; `GET …/export` CSV/PDF. |
| **E2.4 Pruebas** | Incluidas en E | Tests con datos fijos (fixtures jerárquicos) | Añadir `tests/test_madurez.py` o extensión de dashboard tests. |

**Dependencia:** E2 conviene **después** de E1.2 (motor), o con motor limitado a “conteo ponderado”.

---

## 3. Fase G — Seguridad, notificaciones, admin, IA (BRD §14–16)

### 3.1 G1 — Roles, permisos, widgets (§14.1, §15)

| Entregable | Criterio | Estado | Brecha |
|------------|----------|--------|--------|
| Matriz permisos | “Matriz de pruebas por rol” | `P`, `test_fase19_permissions.py`, RBAC E2E | Completar **matriz documentada** (rol × permiso × ruta) y tests por rol en rutas calientes. |
| Widgets / paneles | Alineados a `dashboard_config` | `GET dashboard_configs/my-visibility` + UI | Todos los widgets BRD creados en config por **rol**; revisar IDs vs README. |

### 3.2 G2 — Notificaciones §14.3 (umbrales)

**BRD tabla 14.3:** SLA en riesgo, actividad sin actualizar, tema estancado, avance bajo, plan de firmas.

| Entregable | Estado | Trabajo |
|------------|--------|---------|
| CRUD in-app de notificaciones | Hecho (API + campana) | Completar |
| **Reglas automáticas** | *No* hay worker/cron que dispare filas en `notificacions` | Job **async** (Celery/APScheduler/cron in-app) o **endpoint admin “procesar alertas”**; leer `notificaciones.plantillas` y umbrales `system_settings` |
| Preferencias de usuario | Parcial o ausente | `PATCH /user/notif-preferences` o en `user` profile |
| Pruebas | `test_notificacion.py` smoke | Integración: simular vencimiento SLA → aparece notificación |

### 3.3 G3 — Config avanzada §15

| Elemento BRD | Estado | Trabajo |
|--------------|--------|---------|
| Flujos de estatus | `flujo_estatus`, transiciones liberación, vuln D1 | OK base |
| Períodos de programas | Puede faltar UI/settings explícitos | Claves `ia.*` / programas: revisar y pantalla |
| **Plantillas PDF/Excel** | No end-to-end | Generación o plantillas almacenadas; permisos |
| **Columnas kanban** | `kanban.liberacion` | Ampliar a otros kanban si BRD lo pide |
| **Historial de cambios de configuración** | `audit_logs` en upsert settings | Asegurar **toda** mutación pasa por servicio con `audit_action_prefix`; reporte en `/admin/audit-logs` filtrable por `config` |

### 3.4 G4 — IA (§16) E2E multi-proveedor

| Entregable | Estado | Trabajo |
|------------|--------|---------|
| TM IA `POST …/ia/suggest` | Hecho con dry_run | E2E con mock ya parcial en `ia-integration.spec` |
| Triaje vuln `…/ia/triage-fp` | Hecho | Añadir casos con **mock** por proveedor si se montan varios |
| “Multi-proveedor” sin credenciales | Config `ia.proveedor_activo` | E2E que valide conmutación o al menos `dry_run` por cada valor soportado |

---

## 4. Fase H — Cierre de calidad (Bloque E roadmap / plan §)

| Criterio plan | Dónde está / qué falta |
|---------------|------------------------|
| Cobertura tests (obj. 80% interno) | `make test-cov` = **70%** `cov-fail-under` | Subir umbral y cerrar agujeros en módulos críticos (incremental) |
| OWASP / IDOR | `test_ownership`, `test_contract` | Mantener; pentest manual fuera de repo |
| **Performance** | `docs/PERFORMANCE_OPTIMIZATION.md` | Añadir resultados reales (benchmark, pg explain) en entorno staging |
| **Runbook** | Ver `docs/operations/RUNBOOK.md` (creado como base) | Completar con URLs internas, contactos, SLOs |
| **Aceptación formal** | No automatizable | Acta o checklist de negocio firmado; enlazar en matriz |

---

## 5. Mapeo Dashboards BRD 1–9 (F1) — **diferido**

No forma parte del cierre inmediato de fases E–G–H. El mapeo formal (rutas, endpoints, checklist §13.3) vive en **[`MAPEO_DASHBOARDS_BRD_DIFERIDO.md`](MAPEO_DASHBOARDS_BRD_DIFERIDO.md)** y se completa **después** de cerrar el orden de [`AUDITORIA_HUECOS_Y_ORDEN.md`](AUDITORIA_HUECOS_Y_ORDEN.md) (§10). Aquí solo el gap de producto: **heatmaps, tendencias multi-periodo, comparativas, drill-down con contexto** y tablas 13.2 homogéneas en el resto de módulos.

---

## 6. Orden de implementación (oleadas E/G/H y remanentes)

El orden **maestro** (fases ya trabajadas + E–G–H + F3–F4 + módulos P7–P12) está en **[`AUDITORIA_HUECOS_Y_ORDEN.md` §10](AUDITORIA_HUECOS_Y_ORDEN.md#10-orden-de-implementación-global-propuesta)**. Resumen: **E1.2–E1.3** primero; **E2** tras motor; **G2, G3, G1, G4**; **H**; luego cierres C/D y **F3**; **F1 mapeo detallado** al final (véase mapeo diferido).

---

## 7. Qué *no* está en este repositorio (límite de alcance)

- Pentest externo, cumplimiento legal, firma física de actas.  
- Integraciones con Jira/ServiceNow reales (solo campos y referencias en modelo).  
- Schema Builder 100% dinámico (P2): requiere ADR aparte.  

---

*Este análisis debe actualizarse al cerrar cada entrega de E, G o H. La matriz y el plan se enlazan explícitamente a este documento para trazabilidad.*
