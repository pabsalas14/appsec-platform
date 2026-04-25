# Plan de cumplimiento 100% — Requerimientos de Negocio (BRD)

**Fuente normativa:** `Requerimientos de Negocio (BRD).md` (raíz del repo).  
**Objetivo:** cerrar la brecha entre el sistema actual y el alcance descrito en el BRD, con **criterios de aceptación verificables** por fase (no “MVP de demostración”).

---

## 1. Reglas de gobierno

1. Cada requisito del BRD queda mapeado en la [MATRIZ_COBERTURA_BRD](MATRIZ_COBERTURA_BRD.md) (actualizar al cerrar entregas).
2. Toda entrega toca: **especificación o matriz** + **prueba** (contrato, integración, E2E según fase) + **revisión de seguridad** (IDOR, permisos, CSRF) donde aplique.
3. **“100 %”** = matriz en estado **Hecho** con enlace a evidencia (pantallas, `make test`, pruebas E2E, capturas o checklist de aceptación de negocio).
4. Prioridad por dependencias: **catálogos e inventario correctos (§3)** → **ciclo de vida de hallazgos (§11)** → **operación y pipeline (§10)** → **indicadores y dashboards (§12–13)** → **configuración y notificaciones (§15–16)**.

---

## 2. Fases y entregables (orden recomendado)

### Fase A — Catálogos, inventario y gobierno de datos (BRD §2–3)

| Entregable | Criterio de aceptación (extracto) |
|------------|-----------------------------------|
| A1. **CRUD UI** para cada catálogo/inventario listado en §3 (con listados: filtro, búsqueda, paginación, orden). | Cada entidad con pantalla bajo `app/(dashboard)/` o ruta alineada; no listados “JSON plano” en producción. |
| A2. **Import** masivo con **Descargar template** obligatorio (Regla global §2.7) donde el BRD exija import. | Flujo: template → carga validada → error por fila; test de API o E2E. |
| A3. **Export** a Excel/CSV de cada catálogo. | `GET` export o equivalente, permisos, auditoría si aplica (A7). |
| A4. **Jerarquía organizacional** (§3.1) en todos los flujos que afecte herencia. | Comprobaciones con datos: vulnerabilidad/pipeline heredan subdirección…celula según reglas. |

### Fase B — Programas anuales y motor de scoring (BRD §4–5)

| Entregable | Criterio de aceptación (extracto) |
|------------|-----------------------------------|
| B1. **Definición de actividades, pesos, sub-estados** por mes y programa (admin / settings). | Configuración reflejada en cálculo de avance sin tocar código. |
| B2. **Vinculación** de actividades a entidades (ej. remediación → concentrado de hallazgos). | Cálculo automático o job documentado. |
| B3. **Programas 5.1–5.2:** campos de motores (SAST/SCA/CDS, DAST) alineados a tablas del BRD o justificación de reducción. | Diccionario de campos; importación; vistas por motor. |
| B4. **MDA (§5.3):** encabezado, múltiples activos, backlog, plan de trabajo, adjuntos, IA. | Checklist de BRD; pruebas de integración. |

### Fase C — Operación, pipeline y match (BRD §10)

| Entregable | Criterio de aceptación (extracto) |
|------------|-----------------------------------|
| C1. **Liberaciones (flujo Jira)** con estados, participantes, pruebas, SLA. | Flujo y campos; tablero o lista con filtros §13.2. |
| C2. **Pipeline SAST/DAST** (nivel 1 y 2), **match** `Scan ID` + `Branch`, carga de detalle. | Prueba de match; import con template. |
| C3. **Kanban** de liberaciones con columnas configurables (BRD §15 + §13.3). | Columnas en DB; transiciones. |

### Fase D — Vulnerabilidades, excepciones, aceptación (BRD §11)

| Entregable | Criterio de aceptación (extracto) |
|------------|-----------------------------------|
| D1. **Estatus** y transiciones 100% configurables; equivalencias “Activa/Remediada/FP”. | Admin; tests de regresión de flujo. |
| D2. **Excepciones y aceptación de riesgo** con aprobación y impacto en SLA. | Reglas y reportes. |

### Fase E — Indicadores y score de madurez (BRD §12)

| Entregable | Criterio de aceptación (extracto) |
|------------|-----------------------------------|
| E1. Indicadores **XXX-001…** y adicionales con fórmulas verificables. | Suite de pruebas sobre datos sintéticos. |
| E2. **Madurez** por célula, subdirección, organización. | Vistas o exports con cálculo auditado. |

### Fase F — Dashboards y drill-down (BRD §13)

| Entregable | Criterio de aceptación (extracto) |
|------------|-----------------------------------|
| F1. **9 dashboards** con contenido del BRD (tarjetas, tablas, tendencias) y **navegación** entre ellos. | Checklist por Dashboard 1–9. |
| F2. **Drill-down** organizacional y por motor/severidad (4 niveles cuando aplique) + **breadcrumbs** visibles. | UX; pruebas E2E de navegación. |
| F3. **Filtros contextuales** de la tabla 13.2 en cada módulo. | Filtro por campo documentado. |
| F4. **Paneles clickeables** a detalle. | Cada panel con ruta; sin links rotos. |

### Fase G — Seguridad, notificaciones, admin (BRD §14–15) e IA (§16)

| Entregable | Criterio de aceptación (extracto) |
|------------|-----------------------------------|
| G1. **Roles** libres, permisos ver/créd/… y **widget/panel** completos. | Matriz de pruebas por rol. |
| G2. **Notificaciones** in-app y umbrales (tabla 14.3). | Reglas; bell; preferencias. |
| G3. **Config** avanzada: plantillas de reporte, periodos, columnas kanban, historial. | Trazas en `audit_logs` o entidad de config. |
| G4. **IA** triaje/MDA con pruebas E2E **multi-proveedor** (Fase 24 del roadmap). | Mocks o entornos; sin exponer credenciales. |

### Fase H — Cierre de calidad (alineada roadmap Bloque E)

- Cobertura de tests de negocio y **no regresión** (objetivo del programa: 80%+ cobertura, OWASP, IDOR) según criterio interno.  
- **Performance** y **runbook** de producción.  
- **Aceptación formal** con negocio: firma o acta de cierre por módulo.

---

## 3. Ejecución inmediata (en curso en repo)

- Documentación: este plan + matriz (actualizar filas al cerrar entregas).  
- **Cerrado reciente (API):** permisos `catalogs.*` en §3.1; exports CSV con `audit_record` (auditorías, temas emergentes; **export** dedicado de programa SAST aún no — prioridad tras estabilidad del teardown de tests con FKs a `repositorios`); tests de regresión (readonly, exports, triaje IA `super_admin`). `tests/conftest.py`: `TRUNCATE` abarca cadenas SAST/pipeline/revisión de código; reintentos ante **deadlock** en PostgreSQL. *Desarrollo con Docker (sin bind-mount del backend):* tras tocar `backend/tests/`, `docker compose build backend` (o `make test` con imagen al día) para que el contenedor use el código.  
- **Siguiente prioridad (huecos mayores):**  
  1. **A2** — import + plantilla descargable en catálogos BRD que lo exijan (un flujo piloto reutilizable).  
  2. **A3** — extender exports a inventario (`repositorios`, `activo_webs`) definiendo permiso (p. ej. ampliar `catalogs` o `programs` según decisión en ADR breve).  
  3. **F2/F3** — drill-down y filtros §13.2 en dashboards existentes; breadcrumbs §13 ya parcialmente en UI.  
  4. **G2** — notificaciones §14.3 (modelo mínimo + bell).  
- Ejecutar `make types` tras cambios de OpenAPI y commitear `frontend/src/types/api.ts`.

---

## 4. Lo que el BRD asume y debe validarse

- **Schema Builder** completo: si se interpreta como “campos 100% dinámicos por entidad” sin migraciones, implica un **módulo de metadatos**; si se reduce a “campos fijos alineados al BRD”, documentar decisión en matriz.  
- **Import universal**: cada pantalla con import debe cumplir la regla del template; la matriz marcará parcial si falta.  
- **KPIs** y **cálculos** deben ser reproducibles; los tests de negocio son obligatorios en Fase E.

---

*Este plan vive bajo `docs/brd/` y debe actualizarse al cerrar cada fase. El README principal del repositorio enlaza a esta carpeta para visibilidad.*
