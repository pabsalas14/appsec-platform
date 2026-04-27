# Dashboard Endpoints - Fase 2

Documentación completa de todos los endpoints de dashboards implementados en la plataforma AppSec.

**Versión:** 1.0  
**Última actualización:** Abril 2026  
**Total de endpoints:** 24 implementados + 11 planificados (fases 3-8)

---

## 📊 Resumen de Endpoints

### Dashboard Analytics (11 endpoints)
Endpoints de lectura para vistas analíticas multidimensionales.

| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/v1/dashboard/stats` | GET | Estadísticas agregadas del dashboard | `P.DASHBOARDS.VIEW` |
| `/api/v1/dashboard/executive` | GET | KPIs ejecutivos (Dashboard 1) | `P.DASHBOARDS.VIEW` |
| `/api/v1/dashboard/team` | GET | Vista de equipo (Dashboard 2) | `P.DASHBOARDS.VIEW` |
| `/api/v1/dashboard/programs` | GET | Programas consolidados (Dashboard 3) | `P.DASHBOARDS.VIEW` |
| `/api/v1/dashboard/program-detail` | GET | Detalle de programa (Dashboard 4) | `P.DASHBOARDS.VIEW` |
| `/api/v1/dashboard/vulnerabilities` | GET | Vulnerabilidades multidimensional (Dashboard 5) | `P.DASHBOARDS.VIEW` |
| `/api/v1/dashboard/releases` | GET | Resumen de releases (Dashboard 6-7) | `P.DASHBOARDS.VIEW` |
| `/api/v1/dashboard/releases-table` | GET | Releases en formato tabla | `P.DASHBOARDS.VIEW` |
| `/api/v1/dashboard/releases-kanban` | GET | Releases en formato kanban | `P.DASHBOARDS.VIEW` |
| `/api/v1/dashboard/initiatives` | GET | Iniciativas (Dashboard 8) | `P.DASHBOARDS.VIEW` |
| `/api/v1/dashboard/emerging-themes` | GET | Temas emergentes (Dashboard 9) | `P.DASHBOARDS.VIEW` |

### Dashboard Configuration (6 endpoints)
Endpoints de configuración de roles y visibilidad de widgets.

| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/v1/dashboard-config/my-visibility` | GET | Visibilidad de widgets para rol actual | `get_current_user` |
| `/api/v1/dashboard-config` | GET | Listar todas las configs | `require_role("super_admin")` |
| `/api/v1/dashboard-config/{id}` | GET | Obtener config específica | `require_role("super_admin")` |
| `/api/v1/dashboard-config` | POST | Crear config de widget | `require_role("super_admin")` |
| `/api/v1/dashboard-config/{id}` | PATCH | Actualizar config | `require_role("super_admin")` |
| `/api/v1/dashboard-config/{id}` | DELETE | Eliminar config | `require_role("super_admin")` |

### Dashboard Builder (7 endpoints)
Endpoints para crear y gestionar dashboards personalizados.

| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/v1/admin/dashboard-builder/dashboards` | POST | Crear dashboard personalizado | `get_current_user` |
| `/api/v1/admin/dashboard-builder/dashboards` | GET | Listar dashboards | `get_current_user` |
| `/api/v1/admin/dashboard-builder/dashboards/{id}` | GET | Obtener dashboard | `get_current_user` |
| `/api/v1/admin/dashboard-builder/dashboards/{id}` | PATCH | Actualizar dashboard | `get_current_user` |
| `/api/v1/admin/dashboard-builder/dashboards/{id}` | DELETE | Eliminar dashboard | `get_current_user` |
| `/api/v1/admin/dashboard-builder/dashboards/{id}/access` | POST | Otorgar acceso | `get_current_user` |
| `/api/v1/admin/dashboard-builder/dashboards/{id}/config` | POST | Configurar widget | `get_current_user` |

---

## 📈 Dashboard Analytics

### 1. GET /api/v1/dashboard/stats

Obtiene estadísticas agregadas del dashboard para el usuario actual.

**Autenticación:** `require_permission(P.DASHBOARDS.VIEW)`

**Parámetros:**
- Ninguno

**Status codes:**
- `200` OK - Estadísticas retornadas exitosamente
- `401` Unauthorized - Token inválido o expirado
- `403` Forbidden - Permisos insuficientes

**Response:**
```json
{
  "code": 200,
  "data": {
    "scope": "user",
    "totals": {
      "tasks": 42,
      "completed_tasks": 28,
      "pending_tasks": 14,
      "users": 1,
      "active_users": 1
    },
    "task_breakdown": [
      {
        "status": "completed",
        "count": 28
      },
      {
        "status": "pending",
        "count": 14
      }
    ],
    "users_by_role": [],
    "activity": [
      {
        "day": "2026-04-25",
        "count": 5
      }
    ],
    "recent_audit_logs": []
  }
}
```

**Ejemplo curl:**
```bash
curl -X GET "http://localhost:8000/api/v1/dashboard/stats" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Notas:**
- Usuarios regulares ven contadores en su scope (`user_id`)
- Admins ven contadores globales + `users_by_role` + `recent_activity`
- El `scope` diferencia permisos: `"user"` o `"admin"`

---

### 2. GET /api/v1/dashboard/executive

Dashboard 1 - KPIs ejecutivos de alto nivel.

**Autenticación:** `require_permission(P.DASHBOARDS.VIEW)`

**Parámetros (Query):**
- `subdireccion_id` (UUID, opcional) - Filtrar por subdirección
- `gerencia_id` (UUID, opcional) - Filtrar por gerencia
- `organizacion_id` (UUID, opcional) - Filtrar por organización
- `celula_id` (UUID, opcional) - Filtrar por célula

**Status codes:**
- `200` OK
- `401` Unauthorized
- `403` Forbidden

**Response:**
```json
{
  "code": 200,
  "data": {
    "kpis": {
      "total_vulnerabilities": 234,
      "critical_count": 8,
      "sla_compliance": 85
    },
    "by_severity": {
      "Critica": 8,
      "Alta": 32,
      "Media": 105,
      "Baja": 89,
      "Informativa": 0
    },
    "trend": {
      "new_vulnerabilities_7d": 12
    },
    "risk_level": "MEDIUM",
    "applied_filters": {
      "subdireccion_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Ejemplo curl:**
```bash
curl -X GET "http://localhost:8000/api/v1/dashboard/executive?subdireccion_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Performance:** < 500ms (índices en vulnerabilidad.severidad, vulnerabilidad.created_at)

---

### 3. GET /api/v1/dashboard/team

Dashboard 2 - Vista de equipo por analista y carga de trabajo.

**Autenticación:** `require_permission(P.DASHBOARDS.VIEW)`

**Parámetros (Query):**
- `subdireccion_id`, `gerencia_id`, `organizacion_id`, `celula_id` (UUID, opcionales)

**Response:**
```json
{
  "code": 200,
  "data": {
    "team_size": 5,
    "analysts": [
      {
        "user_id": "550e8400-e29b-41d4-a716-446655440001",
        "total_vulnerabilities": 45,
        "open_vulnerabilities": 18,
        "closed_vulnerabilities": 27,
        "closure_rate": 60
      }
    ],
    "applied_filters": {}
  }
}
```

**Ejemplo curl:**
```bash
curl -X GET "http://localhost:8000/api/v1/dashboard/team" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. GET /api/v1/dashboard/programs

Dashboard 3 - Programas consolidados usando datos de vulnerabilidades.

**Autenticación:** `require_permission(P.DASHBOARDS.VIEW)`

**Parámetros:** Filtros jerárquicos (subdireccion_id, gerencia_id, organizacion_id, celula_id)

**Response:**
```json
{
  "code": 200,
  "data": {
    "total_programs": 7,
    "avg_completion": 68,
    "programs_at_risk": 2,
    "program_breakdown": [
      {
        "program": "SAST",
        "total_findings": 89,
        "closed_findings": 64,
        "completion_percentage": 72
      },
      {
        "program": "DAST",
        "total_findings": 45,
        "closed_findings": 28,
        "completion_percentage": 62
      }
    ],
    "applied_filters": {}
  }
}
```

**Criterio de riesgo:** Programa "at_risk" si completion < 60%

---

### 5. GET /api/v1/dashboard/program-detail

Dashboard 4 - Detalle de programa (zoom) por motor/fuente.

**Autenticación:** `require_permission(P.DASHBOARDS.VIEW)`

**Parámetros:**
- `program` (string, query) - Nombre del programa: `sast`, `dast`, `sca`, `tm`, `mast`, `auditoria`, `terceros`
- Filtros jerárquicos

**Response:**
```json
{
  "code": 200,
  "data": {
    "program": "sast",
    "source": "SAST",
    "total_findings": 89,
    "open_findings": 25,
    "closed_findings": 64,
    "overdue_findings": 3,
    "completion_percentage": 72,
    "applied_filters": {}
  }
}
```

**Ejemplo curl:**
```bash
curl -X GET "http://localhost:8000/api/v1/dashboard/program-detail?program=sast" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. GET /api/v1/dashboard/vulnerabilities

Dashboard 5 - Vista multidimensional de vulnerabilidades.

**Autenticación:** `require_permission(P.DASHBOARDS.VIEW)`

**Parámetros:** Filtros jerárquicos

**Response:**
```json
{
  "code": 200,
  "data": {
    "total_vulnerabilities": 234,
    "by_severity": {
      "CRITICA": 8,
      "ALTA": 32,
      "MEDIA": 105,
      "BAJA": 89
    },
    "by_state": {
      "Abierta": 145,
      "En Progreso": 56,
      "Remediada": 20,
      "Cerrada": 13
    },
    "overdue_count": 8,
    "sla_status": {
      "green": 226,
      "yellow": 8,
      "red": 0
    },
    "applied_filters": {}
  }
}
```

**Regla BRD D2:** El SLA vencido excluye:
- Aceptaciones de riesgo aprobadas
- Excepciones vigentes y aprobadas

---

### 7. GET /api/v1/dashboard/releases

Dashboard 6-7 - Resumen de releases (tabla + kanban).

**Autenticación:** `require_permission(P.DASHBOARDS.VIEW)`

**Parámetros:** Filtros jerárquicos

**Response:**
```json
{
  "code": 200,
  "data": {
    "total_releases": 42,
    "pending_approval": 8,
    "in_progress": 15,
    "completed": 19,
    "status_distribution": {
      "pending_approval": 8,
      "in_progress": 15,
      "completed": 19
    },
    "applied_filters": {}
  }
}
```

**Estados:** Pendiente Aprobación, Design Review, Security Validation, Completed

---

### 8. GET /api/v1/dashboard/releases-table

Dashboard 6 - Releases en formato tabla.

**Autenticación:** `require_permission(P.DASHBOARDS.VIEW)`

**Parámetros:**
- `limit` (int, default=50, max=200) - Número de registros
- Filtros jerárquicos

**Response:**
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "nombre": "Release v2.1.0",
        "version": "2.1.0",
        "estado_actual": "In Progress",
        "jira_referencia": "PROJ-1234",
        "created_at": "2026-04-25T10:30:00"
      }
    ],
    "count": 1,
    "applied_filters": {}
  }
}
```

---

### 9. GET /api/v1/dashboard/releases-kanban

Dashboard 7 - Releases en formato kanban.

**Autenticación:** `require_permission(P.DASHBOARDS.VIEW)`

**Response:**
```json
{
  "code": 200,
  "data": {
    "columns": {
      "Pendiente Aprobación": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "nombre": "Release v2.1.0",
          "version": "2.1.0"
        }
      ],
      "Design Review": [],
      "Security Validation": []
    },
    "total_cards": 25,
    "applied_filters": {}
  }
}
```

---

### 10. GET /api/v1/dashboard/initiatives

Dashboard 8 - Iniciativas.

**Autenticación:** `require_permission(P.DASHBOARDS.VIEW)`

**Parámetros:** Filtros jerárquicos

**Response:**
```json
{
  "code": 200,
  "data": {
    "total_initiatives": 12,
    "in_progress": 7,
    "completed": 5,
    "completion_percentage": 42,
    "applied_filters": {}
  }
}
```

---

### 11. GET /api/v1/dashboard/emerging-themes

Dashboard 9 - Temas emergentes.

**Autenticación:** `require_permission(P.DASHBOARDS.VIEW)`

**Parámetros:** Filtros jerárquicos

**Response:**
```json
{
  "code": 200,
  "data": {
    "total_themes": 8,
    "unmoved_7_days": 2,
    "active": 6,
    "applied_filters": {}
  }
}
```

**Criterio:** "unmoved_7_days" = no actualizado en últimos 7 días

---

## ⚙️ Dashboard Configuration

### 12. GET /api/v1/dashboard-config/my-visibility

Retorna el mapa de visibilidad de widgets para el rol actual del usuario.

**Autenticación:** `get_current_user`

**Parámetros:**
- `dashboard_id` (string, default="home") - ID del dashboard

**Response:**
```json
{
  "code": 200,
  "data": {
    "dashboard_id": "home",
    "role": "analyst",
    "default_visible": true,
    "widgets": {
      "kpi_card_1": {
        "visible": true,
        "editable_by_role": false
      },
      "trend_chart_1": {
        "visible": false,
        "editable_by_role": true
      }
    }
  }
}
```

---

### 13. GET /api/v1/dashboard-config

Listar todas las configuraciones de dashboard (super_admin only).

**Autenticación:** `require_role("super_admin")`

**Parámetros:**
- `page` (int, default=1)
- `page_size` (int, default=50)

**Response:**
```json
{
  "code": 200,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "dashboard_id": "home",
      "role_id": "550e8400-e29b-41d4-a716-446655440001",
      "widget_id": "kpi_card_1",
      "visible": true,
      "editable_by_role": false,
      "created_at": "2026-04-01T08:00:00"
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 50,
    "total": 145
  }
}
```

---

### 14. GET /api/v1/dashboard-config/{id}

Obtener una configuración específica.

**Autenticación:** `require_role("super_admin")`

**Response:** Objeto DashboardConfig único

---

### 15. POST /api/v1/dashboard-config

Crear nueva configuración de widget.

**Autenticación:** `require_role("super_admin")`

**Request body:**
```json
{
  "dashboard_id": "home",
  "role_id": "550e8400-e29b-41d4-a716-446655440001",
  "widget_id": "kpi_card_1",
  "visible": true,
  "editable_by_role": false
}
```

**Status codes:**
- `201` Created
- `400` Bad Request - Validación fallida
- `403` Forbidden
- `409` Conflict - Duplicado existente

---

### 16. PATCH /api/v1/dashboard-config/{id}

Actualizar configuración.

**Request body (campos opcionales):**
```json
{
  "visible": false,
  "editable_by_role": true
}
```

---

### 17. DELETE /api/v1/dashboard-config/{id}

Eliminar configuración (soft delete).

**Status codes:**
- `200` OK
- `404` Not Found

---

## 🏗️ Dashboard Builder

### 18. POST /api/v1/admin/dashboard-builder/dashboards

Crear nuevo dashboard personalizado.

**Autenticación:** `get_current_user`

**Request body:**
```json
{
  "name": "Mi Dashboard",
  "description": "Dashboard personalizado para análisis",
  "layout": "grid",
  "widgets": [
    {
      "id": "widget_1",
      "type": "kpi_card",
      "config": {
        "metric": "total_vulnerabilities",
        "title": "Total de Vulnerabilidades"
      }
    }
  ]
}
```

**Status codes:**
- `201` Created
- `400` Bad Request
- `500` Internal Server Error

**Response:**
```json
{
  "code": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Mi Dashboard",
    "description": "Dashboard personalizado para análisis",
    "created_by": "550e8400-e29b-41d4-a716-446655440001",
    "created_at": "2026-04-25T14:30:00",
    "updated_at": "2026-04-25T14:30:00"
  }
}
```

---

### 19. GET /api/v1/admin/dashboard-builder/dashboards

Listar todos los dashboards accesibles.

**Parámetros:**
- `skip` (int, default=0, ge=0)
- `limit` (int, default=10, ge=1, le=100)

**Response:**
```json
{
  "code": 200,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Mi Dashboard",
      "description": "Dashboard personalizado",
      "created_by": "550e8400-e29b-41d4-a716-446655440001",
      "created_at": "2026-04-25T14:30:00"
    }
  ],
  "meta": {
    "skip": 0,
    "limit": 10,
    "total": 5
  }
}
```

---

### 20. GET /api/v1/admin/dashboard-builder/dashboards/{dashboard_id}

Obtener dashboard específico.

**Parámetro:**
- `dashboard_id` (UUID) - ID del dashboard

**Status codes:**
- `200` OK
- `400` Bad Request - UUID inválido
- `404` Not Found

---

### 21. PATCH /api/v1/admin/dashboard-builder/dashboards/{dashboard_id}

Actualizar dashboard.

**Request body:**
```json
{
  "name": "Dashboard Actualizado",
  "description": "Nueva descripción",
  "widgets": []
}
```

**Validaciones:**
- Solo el creador puede actualizar
- Retorna `403 Forbidden` si no es el propietario

---

### 22. DELETE /api/v1/admin/dashboard-builder/dashboards/{dashboard_id}

Eliminar dashboard (soft delete).

**Validaciones:**
- Solo el creador puede eliminar
- Retorna `403 Forbidden` si no es el propietario

**Response:**
```json
{
  "code": 200,
  "data": {
    "message": "Dashboard deleted"
  }
}
```

---

### 23. POST /api/v1/admin/dashboard-builder/dashboards/{dashboard_id}/access

Otorgar acceso a un dashboard (por rol o usuario).

**Request body:**
```json
{
  "dashboard_id": "550e8400-e29b-41d4-a716-446655440000",
  "role_id": "550e8400-e29b-41d4-a716-446655440002",
  "user_id": null,
  "access_level": "view"
}
```

**Parámetros:**
- `role_id` (UUID, opcional) - Otorgar acceso a rol
- `user_id` (UUID, opcional) - Otorgar acceso a usuario
- `access_level` (string) - Nivel de acceso: `view`, `edit`, `admin`

**Status codes:**
- `200` OK
- `400` Bad Request
- `500` Internal Server Error

---

### 24. POST /api/v1/admin/dashboard-builder/dashboards/{dashboard_id}/config

Configurar visibilidad de widget por rol.

**Request body:**
```json
{
  "dashboard_id": "550e8400-e29b-41d4-a716-446655440000",
  "role_id": "550e8400-e29b-41d4-a716-446655440002",
  "widget_id": "kpi_card_1",
  "visible": true,
  "editable_by_role": false
}
```

---

## 🔄 Filtros Jerárquicos

Todos los endpoints de analytics soportan filtros jerárquicos opcionales:

```
Organización → Subdirección → Gerencia → Célula
```

Parámetros disponibles:
```python
@Query(default=None)
subdireccion_id: UUID | None

@Query(default=None)
gerencia_id: UUID | None

@Query(default=None)
organizacion_id: UUID | None

@Query(default=None)
celula_id: UUID | None
```

**Comportamiento:**
- Cualquier combinación de filtros es válida
- Filtros se aplican con AND lógico
- Si ninguno se especifica, retorna datos globales
- Response incluye `applied_filters` para auditoría

---

## 📊 Esquemas de Response

### Envelope Global

Todos los endpoints retornan un envelope consistente:

```json
{
  "code": 200,
  "data": {},
  "meta": {},
  "error": null
}
```

### Status Codes Comunes

| Código | Significado |
|--------|------------|
| `200` | OK - Request exitoso |
| `201` | Created - Recurso creado |
| `204` | No Content - Eliminado exitosamente |
| `400` | Bad Request - Validación fallida |
| `401` | Unauthorized - Token inválido/expirado |
| `403` | Forbidden - Permisos insuficientes |
| `404` | Not Found - Recurso no existe |
| `409` | Conflict - Recurso duplicado |
| `500` | Internal Server Error - Error del servidor |

---

## 🚀 Performance Benchmarks

| Endpoint | Expected Time | Índices Requeridos |
|----------|----------------|-------------------|
| `/stats` | < 200ms | audit_log.actor_user_id, task.user_id |
| `/executive` | < 500ms | vulnerabilidad.severidad, vulnerabilidad.created_at |
| `/team` | < 400ms | vulnerabilidad.user_id, vulnerabilidad.estado |
| `/programs` | < 600ms | vulnerabilidad.fuente, vulnerabilidad.estado |
| `/program-detail` | < 400ms | vulnerabilidad.fuente, vulnerabilidad.severidad |
| `/vulnerabilities` | < 500ms | vulnerabilidad.severidad, vulnerabilidad.estado |
| `/releases` | < 300ms | service_release.estado_actual |
| `/releases-table` | < 400ms | service_release.created_at |
| `/initiatives` | < 350ms | iniciativa.estado |
| `/emerging-themes` | < 300ms | tema_emergente.updated_at |

**Target:** Todos < 2 segundos en producción con 100k registros.

---

## 🔐 Seguridad

### Autenticación

- Cookie-only (ADR-0010): Solo cookies, sin tokens en JSON
- CSRF protection: Double-submit token para mutaciones
- Rate limiting: Por IP + usuario

### Autorización

- ADR-0001: Todos los endpoints usan `require_permission` o `require_role`
- ADR-0004: Dashboards personalizados requieren `require_ownership`
- ADR-0008: Acceso restringido por rol administrativo

### Auditoría

- Todas las mutaciones se registran en `audit_logs`
- `audit_action_prefix`: `"dashboard"` para rastrear cambios

---

## 📝 Ejemplo Completo

### Obtener Dashboard Ejecutivo

```bash
#!/bin/bash

BASE_URL="http://localhost:8000"
TOKEN="eyJhbGc..."  # Tu JWT token

# 1. Obtener estadísticas generales
curl -X GET "$BASE_URL/api/v1/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 2. Obtener KPIs ejecutivos
curl -X GET "$BASE_URL/api/v1/dashboard/executive" \
  -H "Authorization: Bearer $TOKEN"

# 3. Obtener vista de equipo
curl -X GET "$BASE_URL/api/v1/dashboard/team" \
  -H "Authorization: Bearer $TOKEN"

# 4. Crear dashboard personalizado
curl -X POST "$BASE_URL/api/v1/admin/dashboard-builder/dashboards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Dashboard",
    "description": "Dashboard de análisis",
    "layout": "grid",
    "widgets": []
  }'

# 5. Configurar visibilidad de widget
curl -X POST "$BASE_URL/api/v1/dashboard-config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard_id": "home",
    "role_id": "role_id_here",
    "widget_id": "kpi_card_1",
    "visible": true,
    "editable_by_role": false
  }'
```

---

## 🔗 Referencias

- **Backend:** `/backend/app/api/v1/dashboard.py`
- **Backend:** `/backend/app/api/v1/dashboard_config.py`
- **Backend:** `/backend/app/api/v1/admin/dashboard_builder.py`
- **Frontend:** `/frontend/src/app/(dashboard)/dashboards/*/page.tsx`
- **Models:** `/backend/app/models/dashboard_*.py`
- **ADRs:** `/docs/adr/`
- **Reglas:** `/AGENTS.md`

---

## 📅 Roadmap - Fases 3-8

### Fase 3: Module View Builder (4 endpoints)
- `POST /api/v1/admin/module-views` - Crear module view
- `GET /api/v1/admin/module-views` - Listar
- `PATCH /api/v1/admin/module-views/{id}` - Actualizar
- `DELETE /api/v1/admin/module-views/{id}` - Eliminar

### Fase 4: Custom Fields (4 endpoints)
- `POST /api/v1/admin/custom-fields` - Crear field
- `GET /api/v1/admin/custom-fields` - Listar
- `PATCH /api/v1/admin/custom-fields/{id}` - Actualizar
- `DELETE /api/v1/admin/custom-fields/{id}` - Eliminar

### Fase 5: Formulas + Validation (3 endpoints)
- `POST /api/v1/admin/formulas` - Crear fórmula
- `PATCH /api/v1/admin/formulas/{id}` - Actualizar
- `DELETE /api/v1/admin/formulas/{id}` - Eliminar

### Fase 6: Catalog Builder (3 endpoints)
- `POST /api/v1/admin/catalogs` - Crear catálogo
- `PATCH /api/v1/admin/catalogs/{id}` - Actualizar
- `DELETE /api/v1/admin/catalogs/{id}` - Eliminar

### Fase 7: Navigation Builder (3 endpoints)
- `POST /api/v1/admin/navigation` - Crear nav
- `PATCH /api/v1/admin/navigation/{id}` - Actualizar
- `DELETE /api/v1/admin/navigation/{id}` - Eliminar

### Fase 8: AI Automation Rules (5 endpoints)
- `POST /api/v1/admin/ai-rules` - Crear regla
- `GET /api/v1/admin/ai-rules` - Listar
- `GET /api/v1/admin/ai-rules/{id}` - Obtener
- `PATCH /api/v1/admin/ai-rules/{id}` - Actualizar
- `DELETE /api/v1/admin/ai-rules/{id}` - Eliminar

**Total futuro:** 24 existentes + 22 planeados = 46 endpoints

---

**Documento generado:** Abril 2026  
**Versión:** 1.0  
**Mantenedor:** Equipo de plataforma AppSec
