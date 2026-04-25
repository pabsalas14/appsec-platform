# ESPECIFICACIÓN: Endpoints Backend necesarios para Dashboards (Fase 2)

> **Responsable**: Claude (Backend)  
> **Timeline**: Después de Fase 1 Frontend completa  
> **Total Endpoints**: ~35 distribuidos en 9 dashboards

---

## 🎯 PRIORIDAD 1: Dashboard Builder (Core)

### 1.1 Dashboard CRUD Endpoints

```python
# Base: /api/v1/dashboards

POST /api/v1/dashboards
├─ Input: { nombre, descripcion?, layout_json, is_system=false, is_template=false, activo=true }
├─ Output: Dashboard { id, nombre, descripcion, layout_json, created_by, created_at }
├─ Auth: require_role("admin", "super_admin", "ciso")
└─ Audit: dashboards.create

GET /api/v1/dashboards
├─ Query: ?search=&is_system=&page=1&limit=50
├─ Output: { data: [Dashboard], total, page, limit }
├─ Auth: Autenticado
└─ Filter: Por ownership + permisos

GET /api/v1/dashboards/{id}
├─ Output: Dashboard { id, nombre, layout_json, widgets[], ... }
├─ Auth: Autenticado
└─ Check: require_ownership()

PATCH /api/v1/dashboards/{id}
├─ Input: { nombre?, descripcion?, layout_json?, activo? }
├─ Output: Dashboard (actualizado)
├─ Auth: require_ownership()
└─ Audit: dashboards.update

DELETE /api/v1/dashboards/{id}
├─ Action: Soft delete
├─ Auth: require_ownership() + require_role("super_admin")
└─ Audit: dashboards.delete
```

---

## 🎯 PRIORIDAD 2: Dashboard 1 (Ejecutivo) Endpoints

**Ubicación**: `/api/v1/dashboard/executive*`

### 2.1 Dashboard 1 - KPIs y Métricas Generales

```python
GET /api/v1/dashboard/executive-kpis
├─ Query: ?month=current&subdir_id=&celula_id=
├─ Output: {
│   "data": {
│     "avance_programas": { "value": 68, "trend": { "direction": "up", "percentage": 5 }, "unit": "%" },
│     "vulns_criticas": { "value": 12, "trend": { "direction": "down", "percentage": 8 }, "unit": "count" },
│     "liberaciones_activas": { "value": 5, "trend": { "direction": "neutral", "percentage": 0 }, "unit": "count" },
│     "temas_emergentes": { "value": 23, "trend": { "direction": "up", "percentage": 12 }, "unit": "count" },
│     "auditorias": { "value": 3, "trend": { "direction": "neutral", "percentage": 0 }, "unit": "count" }
│   }
│ }
├─ Lógica:
│  ├─ avance_programas: (programas completadas / programas totales) * 100
│  ├─ vulns_criticas: COUNT(vulnerabilidades WHERE severidad='CRITICA' AND deleted_at IS NULL)
│  ├─ liberaciones_activas: COUNT(service_releases WHERE estado NOT IN ['Done', 'Cerrada'])
│  ├─ temas_emergentes: COUNT(temas_emergentes WHERE deleted_at IS NULL)
│  └─ auditorias: COUNT(auditorias WHERE estado='En Progreso')
├─ Trends: Comparar mes actual vs mes anterior
├─ Scope: Respectar scope jerárquico usuario (subdir_id, celula_id)
├─ Auth: Autenticado (require_role("ciso", "admin", "director_subdireccion"))
└─ Cache: 5 minutos

GET /api/v1/dashboard/security-posture
├─ Query: ?month=current
├─ Output: {
│   "data": {
│     "percentage": 72,
│     "trend": { "direction": "up", "percentage": 2 },
│     "details": {
│       "closed": 145,
│       "in_progress": 52,
│       "open": 30
│     }
│   }
│ }
├─ Lógica:
│  ├─ Basado en: (vulns_cerradas / (vulns_cerradas + vulns_abiertas + vulns_en_progreso)) * 100
│  ├─ O alternativa: Score custom basado en IndicadorFormula
│  └─ Considera soft delete
├─ Auth: Autenticado
└─ Cache: 5 minutos

GET /api/v1/dashboard/vuln-tendencia-6-meses
├─ Query: ?subdir_id=&celula_id=
├─ Output: {
│   "data": [
│     { "month": "Oct", "criticas": 18, "altas": 35, "medias": 48, "bajas": 92 },
│     { "month": "Nov", "criticas": 16, "altas": 32, "medias": 45, "bajas": 88 },
│     ...6 meses
│   ]
│ }
├─ Lógica:
│  ├─ Agregar vulnerabilidades por mes x severidad
│  ├─ Últimos 6 meses (retroactivo)
│  ├─ Considerar created_at de vulnerabilidades
│  └─ Soft delete: deleted_at IS NULL
├─ Auth: Autenticado
└─ Cache: 1 hora

GET /api/v1/dashboard/top-repos-criticas
├─ Query: ?limit=5&subdir_id=&celula_id=
├─ Output: {
│   "data": [
│     { "repo_id": "uuid", "label": "api-gateway", "value": 18, "color": "#ef4444" },
│     { "repo_id": "uuid", "label": "auth-service", "value": 15, "color": "#f97316" },
│     ...
│   ]
│ }
├─ Lógica:
│  ├─ TOP N repositorios por COUNT(vulnerabilidades WHERE severidad='CRITICA')
│  ├─ Ordenar descendente
│  ├─ Limit (default 5)
│  └─ Color: asignar según posición (rojo → naranja → amarillo → verde)
├─ Auth: Autenticado
└─ Cache: 5 minutos

GET /api/v1/dashboard/sla-semaforo
├─ Query: ?
├─ Output: {
│   "data": [
│     { "status": "ok", "label": "En Tiempo", "count": 145, "percentage": 65 },
│     { "status": "warning", "label": "En Riesgo", "count": 52, "percentage": 23 },
│     { "status": "critical", "label": "Vencidas", "count": 30, "percentage": 12 }
│   ]
│ }
├─ Lógica:
│  ├─ Evaluar cada vulnerabilidad vs su SLA
│  ├─ SLA status basado en: fecha_limite_sla - NOW()
│  │  ├─ > 7 días = "ok" (verde)
│  │  ├─ 1-7 días = "warning" (amarillo)
│  │  └─ < 1 día = "critical" (rojo)
│  └─ Contar y calcular porcentajes
├─ Auth: Autenticado
└─ Cache: 30 minutos

GET /api/v1/dashboard/auditorias-activas
├─ Query: ?limit=10&offset=0
├─ Output: {
│   "data": [
│     {
│       "id": "uuid",
│       "nombre": "Auditoría Externa Q1",
│       "tipo": "Externa|Interna",
│       "responsable": "John Doe",
│       "fecha": "2026-03-15",
│       "estado": "En Progreso|Cerrada",
│       "hallazgos": 7
│     },
│     ...
│   ],
│   "total": 25
│ }
├─ Lógica:
│  ├─ GET auditorias (soft delete filter)
│  ├─ Ordenar por created_at DESC
│  ├─ Paginar (limit, offset)
│  └─ Count hallazgos por auditoría (JOIN hallazgo_auditorias)
├─ Auth: Autenticado
└─ Cache: 5 minutos
```

---

## 🎯 PRIORIDAD 3: Dashboard 2-9 Endpoints (~28 más)

**Estos se especificarán después de Dashboard 1 funcional.**

### Resumen por Dashboard:
- **Dashboard 2 (Equipo)**: 2 endpoints
- **Dashboard 3 (Programas)**: 2 endpoints
- **Dashboard 4 (Vulns 4-Drill)**: 13 endpoints (⭐ MÁXIMO COMPLEJO)
- **Dashboard 5 (Concentrado)**: 3 endpoints
- **Dashboard 6 (Operación)**: 3 endpoints
- **Dashboard 7 (Kanban)**: 3 endpoints
- **Dashboard 8 (Iniciativas)**: 2 endpoints
- **Dashboard 9 (Temas)**: 2 endpoints

---

## 🔧 Patrón Estándar (ADR-0001, ADR-0004)

Todos los endpoints deben:

```python
# 1. Response envelope
from app.core.response import success, paginated, error

# 2. Auth + Scope
from app.api.deps import get_current_user, require_role, require_ownership

# 3. Soft delete
query = session.query(Model).filter(Model.deleted_at.isnull())

# 4. Audit log
logger.info("dashboard.executive_kpis", extra={
    "event": "dashboard.executive_kpis",
    "user_id": str(current_user.id),
    "filters": filters,
})

# 5. Servicios (no queries directas)
from app.services.dashboard_service import DashboardService
svc = DashboardService(session)
data = svc.get_executive_kpis(user_id, filters)

# 6. Error handling
except Exception as e:
    logger.error("dashboard.error", extra={"error": str(e)})
    return error("Error cargando dashboard", status_code=500)
```

---

## 📋 Checklists por Endpoint

Para cada endpoint implementado:

- [ ] Request validation (Pydantic schema)
- [ ] Response envelope (success / paginated / error)
- [ ] Auth (require_role o require_ownership)
- [ ] Soft delete filter (deleted_at IS NULL)
- [ ] Scope cascade (org → subdir → celula)
- [ ] Audit log (event name + metadata)
- [ ] Error handling (400/401/403/404/500)
- [ ] Caching (si tarda >100ms)
- [ ] Tests (pytest con fixtures)

---

## 📝 Test Data Fixture (backend/tests/conftest.py)

Agregar para Dashboard 1 testing:

```python
@pytest.fixture
def dashboard_1_test_data(db):
    """Crea datos mínimos para testear Dashboard 1"""
    # 1. Usuarios + roles
    # 2. Programa SAST con 70% completado
    # 3. 12 vulnerabilidades críticas
    # 4. 5 service releases en progreso
    # 5. 23 temas emergentes
    # 6. 3 auditorías en progreso
    # 7. SLA vencido en algunas vulns
    return {
        "subdirections": [...],
        "vulnerabilities": [...],
        "releases": [...],
        "audits": [...],
        "trends": [...],  # 6 meses histórico
    }
```

---

## 🚀 Orden de Implementación Recomendado

1. ✅ Dashboard CRUD (/api/v1/dashboards CRUD)
2. 🔄 Dashboard 1 KPIs (start=hoy)
3. Dashboard 1 Seguridad Postura
4. Dashboard 1 Tendencia 6 meses
5. Dashboard 1 Top Repos
6. Dashboard 1 SLA Semáforo
7. Dashboard 1 Auditorías
8. Tests E2E para Dashboard 1
9. ... Dashboards 2-9 (paralelo con Cursor frontend)

---

**Estado**: Listo para que Claude implemente  
**Última actualización**: 25 Abril 2026 (Sesión 2)
