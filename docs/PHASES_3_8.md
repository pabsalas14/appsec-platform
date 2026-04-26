# Dashboard Platform - Fases 3-8 Roadmap

Documento de especificación para las fases 3-8 de la plataforma de dashboards (post-Fase 2: Dashboard Analytics & Config).

**Versión:** 1.0  
**Escala:** 22 nuevos endpoints  
**Timeline:** Estimado Q2-Q3 2026

---

## 📅 Fases Overview

| Fase | Nombre | Endpoints | Timeline | Impacto |
|------|--------|-----------|----------|---------|
| **1** | Dashboards Base | 3 | ✅ Completada | Visualización básica |
| **2** | Analytics + Config | 24 | ✅ Completada | Multidimensional + personalización |
| **3** | Module View Builder | 4 | Q2 2026 | Vistas temáticas |
| **4** | Custom Fields | 4 | Q2 2026 | Extensibilidad de datos |
| **5** | Formulas + Validation | 3 | Q3 2026 | Cálculos dinámicos |
| **6** | Catalog Builder | 3 | Q3 2026 | Gestión centralizada |
| **7** | Navigation Builder | 3 | Q3 2026 | Navegación dinámica |
| **8** | AI Automation Rules | 5 | Q3 2026 | Automatización inteligente |

---

## 🎯 Fase 3: Module View Builder

**Objetivo:** Crear vistas temáticas personalizadas agrupadas por módulo/contexto.

**Ejemplo:** Agrupar dashboards por "Seguridad de Aplicaciones", "Infraestructura", "Cumplimiento"

### 3.1 POST /api/v1/admin/module-views

Crear nueva module view.

**Request:**
```json
{
  "name": "Seguridad de Aplicaciones",
  "description": "Vistas de SAST, DAST, SCA",
  "slug": "app-security",
  "icon": "shield-check",
  "color": "#3b82f6",
  "dashboards": [
    "executive",
    "vulnerabilities",
    "program-detail"
  ],
  "order": 1,
  "is_public": false
}
```

**Response:**
```json
{
  "code": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Seguridad de Aplicaciones",
    "slug": "app-security",
    "icon": "shield-check",
    "color": "#3b82f6",
    "dashboards": 3,
    "created_at": "2026-05-01T10:00:00",
    "created_by": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

**Autenticación:** `require_role("admin")`

**Status codes:**
- `201` Created
- `400` Bad Request - Slug duplicado o validación
- `403` Forbidden

---

### 3.2 GET /api/v1/admin/module-views

Listar todas las module views.

**Parámetros:**
- `skip` (int, default=0)
- `limit` (int, default=20, max=100)
- `public_only` (bool, default=False)

**Response:**
```json
{
  "code": 200,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Seguridad de Aplicaciones",
      "slug": "app-security",
      "dashboards": 3,
      "is_public": false,
      "order": 1
    }
  ],
  "meta": {
    "skip": 0,
    "limit": 20,
    "total": 5
  }
}
```

---

### 3.3 PATCH /api/v1/admin/module-views/{id}

Actualizar module view.

**Request:**
```json
{
  "name": "Seguridad de Apps (Actualizado)",
  "order": 2
}
```

**Autenticación:** `require_role("admin")`

---

### 3.4 DELETE /api/v1/admin/module-views/{id}

Eliminar module view (soft delete).

**Autenticación:** `require_role("admin")`

---

## 🛠️ Fase 4: Custom Fields

**Objetivo:** Permitir agregar campos personalizados a entidades sin modificar BD.

**Ejemplo:** Agregar campo "Criticidad Negocio" a vulnerabilidades

### 4.1 POST /api/v1/admin/custom-fields

Crear custom field.

**Request:**
```json
{
  "entity": "vulnerabilidad",
  "name": "business_criticality",
  "label": "Criticidad Negocio",
  "type": "select",
  "options": [
    { "value": "critical", "label": "Crítico" },
    { "value": "high", "label": "Alto" },
    { "value": "medium", "label": "Medio" }
  ],
  "required": false,
  "default_value": "medium",
  "visible_by_roles": ["admin", "analyst"]
}
```

**Respuesta:**
```json
{
  "code": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "entity": "vulnerabilidad",
    "name": "business_criticality",
    "label": "Criticidad Negocio",
    "type": "select",
    "order": 15,
    "created_at": "2026-05-05T14:00:00"
  }
}
```

**Tipos soportados:** `text`, `number`, `select`, `multiselect`, `date`, `checkbox`, `email`

---

### 4.2 GET /api/v1/admin/custom-fields

Listar custom fields.

**Parámetros:**
- `entity` (string, opcional) - Filtrar por entidad
- `visible_only` (bool, default=False)

**Response:** Array de CustomField

---

### 4.3 PATCH /api/v1/admin/custom-fields/{id}

Actualizar custom field.

**Request:**
```json
{
  "label": "Criticidad del Negocio",
  "required": true
}
```

**Validaciones:**
- Si `type` cambia, migrar datos existentes
- Si `options` cambia en select, validar referencias

---

### 4.4 DELETE /api/v1/admin/custom-fields/{id}

Eliminar custom field.

**Comportamiento:**
- Soft delete (marcar `deleted_at`)
- Archivar datos existentes en `custom_field_values`

---

## 📐 Fase 5: Formulas + Validation Rules

**Objetivo:** Crear campos calculados y reglas de validación dinámicas.

**Ejemplo:** 
- Fórmula: `DAYS_OVERDUE = TODAY() - SLA_DATE` si SLA_DATE < TODAY()
- Validación: "Criticidad Alta requiere SLA < 7 días"

### 5.1 POST /api/v1/admin/formulas

Crear fórmula (campo calculado).

**Request:**
```json
{
  "entity": "vulnerabilidad",
  "name": "days_overdue",
  "label": "Días Vencidos",
  "expression": "IF(SLA_DATE < TODAY(), DAYS(TODAY() - SLA_DATE), 0)",
  "output_type": "number",
  "display_format": "#,##0",
  "enabled": true
}
```

**Response:**
```json
{
  "code": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "days_overdue",
    "expression": "IF(SLA_DATE < TODAY(), DAYS(TODAY() - SLA_DATE), 0)",
    "output_type": "number",
    "cache_ttl_seconds": 300,
    "last_evaluated": null
  }
}
```

**Sintaxis:** Similar a Excel/Google Sheets
- Funciones: `IF()`, `AND()`, `OR()`, `SUM()`, `DAYS()`, `TODAY()`, etc.
- Operadores: `+`, `-`, `*`, `/`, `=`, `!=`, `<`, `>`, `<=`, `>=`
- Campos de entidad: `$FIELD_NAME`

---

### 5.2 PATCH /api/v1/admin/formulas/{id}

Actualizar fórmula.

**Request:**
```json
{
  "expression": "IF(SLA_DATE < TODAY(), DAYS(TODAY() - SLA_DATE), 0)",
  "cache_ttl_seconds": 600
}
```

**Validaciones:**
- Re-evaluar todas las instancias si `expression` cambia
- Validar sintaxis antes de guardar

---

### 5.3 DELETE /api/v1/admin/formulas/{id}

Eliminar fórmula.

**Comportamiento:**
- Soft delete
- Archivar valores calculados

---

## 📚 Fase 6: Catalog Builder

**Objetivo:** Centralizar catálogos de valores (estados, severidades, fuentes, etc.)

**Ejemplo:** Catálogo "Estados Vulnerabilidad" con valores, colores, SLA

### 6.1 POST /api/v1/admin/catalogs

Crear catálogo.

**Request:**
```json
{
  "name": "Estados Vulnerabilidad",
  "code": "VULN_STATES",
  "description": "Estados posibles de vulnerabilidades",
  "values": [
    {
      "value": "Abierta",
      "label": "Abierta",
      "color": "#ef4444",
      "order": 1,
      "metadata": {
        "sla_days": 7,
        "auto_escalate": true
      }
    },
    {
      "value": "En Progreso",
      "label": "En Progreso",
      "color": "#f59e0b",
      "order": 2,
      "metadata": {
        "sla_days": 14,
        "auto_escalate": false
      }
    }
  ],
  "enabled": true
}
```

**Response:**
```json
{
  "code": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "VULN_STATES",
    "name": "Estados Vulnerabilidad",
    "value_count": 2,
    "created_at": "2026-06-01T09:00:00",
    "created_by": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

---

### 6.2 PATCH /api/v1/admin/catalogs/{id}

Actualizar catálogo.

**Request:**
```json
{
  "values": [
    {
      "value": "Abierta",
      "label": "Abierta",
      "color": "#dc2626",
      "order": 1,
      "metadata": {
        "sla_days": 5
      }
    }
  ]
}
```

**Validaciones:**
- Si valor se elimina, validar que no haya instancias activas
- Si valor se renombra, migrar referencias

---

### 6.3 DELETE /api/v1/admin/catalogs/{id}

Eliminar catálogo.

**Comportamiento:**
- Verificar que no hay referencias
- Soft delete

---

## 🧭 Fase 7: Navigation Builder

**Objetivo:** Construir menú/navegación dinámicamente (sin código).

**Ejemplo:** Crear menú personalizado por rol

### 7.1 POST /api/v1/admin/navigation

Crear estructura de navegación.

**Request:**
```json
{
  "name": "Main Navigation",
  "scope": "admin",
  "items": [
    {
      "label": "Dashboards",
      "icon": "layout-dashboard",
      "order": 1,
      "children": [
        {
          "label": "Ejecutivo",
          "href": "/dashboards/executive",
          "icon": "trending-up",
          "order": 1,
          "visible_by_roles": ["admin", "manager"]
        },
        {
          "label": "Vulnerabilidades",
          "href": "/dashboards/vulnerabilities",
          "icon": "alert-circle",
          "order": 2
        }
      ]
    },
    {
      "label": "Admin",
      "icon": "settings",
      "order": 2,
      "children": [
        {
          "label": "Custom Fields",
          "href": "/admin/custom-fields",
          "icon": "database",
          "visible_by_roles": ["super_admin"]
        }
      ]
    }
  ],
  "enabled": true
}
```

**Response:**
```json
{
  "code": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Main Navigation",
    "scope": "admin",
    "items_count": 2,
    "created_at": "2026-06-10T11:00:00"
  }
}
```

---

### 7.2 PATCH /api/v1/admin/navigation/{id}

Actualizar navegación.

**Request:**
```json
{
  "items": [ /* updated items */ ]
}
```

---

### 7.3 DELETE /api/v1/admin/navigation/{id}

Eliminar navegación (revert a default).

---

## 🤖 Fase 8: AI Automation Rules

**Objetivo:** Crear reglas de automatización basadas en IA/ML.

**Ejemplo:** 
- Asignar automáticamente vulnerabilidades críticas al equipo senior
- Escalar si SLA está próximo a vencer
- Sugerir remedios basados en similaridad

### 8.1 POST /api/v1/admin/ai-rules

Crear regla de automatización.

**Request:**
```json
{
  "name": "Auto-assign Critical Vulns",
  "description": "Asignar automáticamente vulnerabilidades críticas",
  "entity": "vulnerabilidad",
  "trigger": "on_create",
  "condition": {
    "field": "severidad",
    "operator": "equals",
    "value": "CRITICA"
  },
  "actions": [
    {
      "type": "assign",
      "target": "team_senior",
      "parameters": {
        "round_robin": true
      }
    },
    {
      "type": "notify",
      "target": "role:manager",
      "parameters": {
        "template": "critical_vuln_assigned"
      }
    }
  ],
  "enabled": true,
  "priority": 1
}
```

**Response:**
```json
{
  "code": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Auto-assign Critical Vulns",
    "trigger": "on_create",
    "enabled": true,
    "last_executed": null,
    "execution_count": 0
  }
}
```

**Triggers soportados:**
- `on_create` - Al crear
- `on_update` - Al actualizar
- `on_field_change` - Cuando campo específico cambia
- `on_schedule` - Programado (cron)
- `on_webhook` - Webhook externo

**Acciones soportadas:**
- `assign` - Asignar a usuario/rol
- `update_field` - Cambiar campo
- `escalate` - Escalar
- `notify` - Notificar
- `execute_formula` - Ejecutar fórmula
- `call_webhook` - Llamar webhook externo
- `create_jira` - Crear ticket Jira

---

### 8.2 GET /api/v1/admin/ai-rules

Listar todas las reglas.

**Parámetros:**
- `entity` (string, opcional)
- `trigger` (string, opcional)
- `enabled_only` (bool, default=False)

---

### 8.3 GET /api/v1/admin/ai-rules/{id}

Obtener regla específica con estadísticas de ejecución.

**Response:**
```json
{
  "code": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Auto-assign Critical Vulns",
    "trigger": "on_create",
    "enabled": true,
    "execution_count": 42,
    "last_executed": "2026-06-20T15:30:00",
    "success_count": 40,
    "error_count": 2,
    "avg_duration_ms": 245
  }
}
```

---

### 8.4 PATCH /api/v1/admin/ai-rules/{id}

Actualizar regla.

**Request:**
```json
{
  "enabled": false,
  "priority": 2
}
```

---

### 8.5 DELETE /api/v1/admin/ai-rules/{id}

Eliminar regla.

---

## 🏗️ Implementación Técnica

### Base de Datos

Nuevos modelos:

```python
# Fase 3
class ModuleView(Base):
    name: str
    slug: str (unique)
    icon: str
    color: str
    dashboards: List[str]  # JSON array
    order: int

# Fase 4
class CustomField(Base):
    entity: str
    name: str
    type: str  # text, number, select, etc.
    options: dict  # JSON si type=select
    required: bool
    order: int

class CustomFieldValue(Base):
    custom_field_id: UUID
    entity_id: UUID
    value: str

# Fase 5
class Formula(Base):
    entity: str
    name: str
    expression: str
    output_type: str
    cache_ttl: int

class FormulaValue(Base):
    formula_id: UUID
    entity_id: UUID
    value: str
    cached_at: datetime

# Fase 6
class Catalog(Base):
    code: str (unique)
    name: str
    values: dict  # JSON {value: {...}}

# Fase 7
class Navigation(Base):
    name: str
    scope: str
    items: dict  # JSON tree

# Fase 8
class AIRule(Base):
    name: str
    entity: str
    trigger: str
    condition: dict  # JSON
    actions: dict  # JSON
    enabled: bool
    priority: int

class AIRuleExecution(Base):
    rule_id: UUID
    entity_id: UUID
    status: str  # success, failed
    started_at: datetime
    duration_ms: int
    result: dict  # JSON
```

### Servicios

Para cada entidad nueva, crear:

```python
# services/module_view_service.py
ModuleViewService = BaseService[ModuleView, ModuleViewCreate, ModuleViewUpdate](
    ModuleView,
    audit_action_prefix="module_view",
)

# Igual para las demás fases
```

### Rutas

```python
# api/v1/admin/module_views.py
router = APIRouter(prefix="/module-views", tags=["Admin · Module Views"])

# POST, GET, PATCH, DELETE
```

---

## 📊 Impacto Arquitectónico

### Performance

| Fase | Impacto | Mitigación |
|------|---------|-----------|
| 3 | Querys anidadas en navegación | Cache en Redis |
| 4 | EAV pattern → N+1 queries | Índices + eager loading |
| 5 | Evaluación de fórmulas | Query cache + async workers |
| 6 | Catálogos grandes | In-memory cache |
| 7 | Navegación dinámica | HTTP caching headers |
| 8 | Rule execution overhead | Background jobs (Celery) |

### Testing

```python
# tests/test_bloque_c_module_views.py
async def test_module_view_create(client, admin_token):
    response = await client.post(
        "/api/v1/admin/module-views",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Test", "slug": "test"}
    )
    assert response.status_code == 201

# Igual para las demás fases
```

---

## 🔐 Seguridad

### Principios

- ✅ Todos los endpoints requieren autenticación
- ✅ Admin endpoints requieren `require_role("admin")` o `require_role("super_admin")`
- ✅ Fórmulas evalúan en sandbox (no acceso a sistema)
- ✅ Todas las mutaciones en `audit_logs`

### Validaciones

- Inyección de SQL: Usar ORM parametrizado
- Inyección en fórmulas: Whitelist de funciones permitidas
- XXE: Parsear XML/JSON de forma segura
- CSRF: Double-submit para mutaciones

---

## 📈 Roadmap Detallado

```
Q2 2026
├─ Semana 1-2: Fase 3 (Module View)
├─ Semana 3-4: Fase 4 (Custom Fields)
└─ Testing + integración

Q3 2026
├─ Semana 1: Fase 5 (Formulas)
├─ Semana 2: Fase 6 (Catalogs)
├─ Semana 3: Fase 7 (Navigation)
├─ Semana 4: Fase 8 (AI Rules)
└─ Testing integración + docs

Q3 2026 (late)
└─ Release v2.0 con todas las fases
```

---

## 📋 Definición de Hecho (Definition of Done)

Para cada fase:

- [ ] Modelos + migraciones
- [ ] Servicios con CRUD
- [ ] Routers con validaciones
- [ ] Tests (contract + ownership + smoke)
- [ ] Documentación de API
- [ ] E2E tests en frontend
- [ ] Frontend UI (si aplica)
- [ ] Performance benchmarks
- [ ] Audit logging
- [ ] PR review + merge

---

## 🔗 Referencias

- **Current Implementation:** `/backend/docs/ENDPOINTS_DASHBOARDS.md` (Fases 1-2)
- **Architecture:** `/docs/adr/`
- **Models:** `/backend/app/models/`
- **Services:** `/backend/app/services/`

---

**Documento generado:** Abril 2026  
**Versión:** 1.0  
**Mantenedor:** Equipo de plataforma AppSec
