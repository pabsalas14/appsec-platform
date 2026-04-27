# Backend Endpoints — Dashboards 1-9 (Fase 2)

## Dashboard 1: Ejecutivo (4 endpoints)

### GET /api/v1/dashboard/executive-kpis
Retorna KPIs para el dashboard ejecutivo.

**Parameters:**
- `month` (optional): Mes específico (formato: YYYY-MM)

**Response:**
```json
{
  "status": "success",
  "data": {
    "avance_programas": 68,  // porcentaje
    "vulns_criticas": 12,    // count
    "liberaciones_activas": 5,
    "temas_emergentes": 3,
    "auditorias": 8
  }
}
```

**Security:** `require_role("ciso", "admin")`

---

### GET /api/v1/dashboard/security-posture
Retorna postura de seguridad global (gauge) y tendencia.

**Response:**
```json
{
  "status": "success",
  "data": {
    "percentage": 72,
    "trend_6_meses": [
      {"month": "10/2025", "value": 65},
      ...
    ]
  }
}
```

---

### GET /api/v1/dashboard/top-repos-criticas
Retorna top 5 repositorios por vulnerabilidades críticas.

**Response:**
```json
{
  "status": "success",
  "data": [
    {"repo_id": "uuid", "nombre": "api-core", "count": 8, "trend": "up"},
    ...
  ]
}
```

---

### GET /api/v1/dashboard/sla-semaforo
Retorna recuento de vulnerabilidades por estado SLA.

**Response:**
```json
{
  "status": "success",
  "data": {
    "on_time": 45,
    "at_risk": 12,
    "overdue": 3
  }
}
```

---

## Dashboard 2: Equipo (2 endpoints)

### GET /api/v1/dashboard/team-summary
Retorna KPIs de equipo.

---

### GET /api/v1/dashboard/team-detail/{user_id}
Retorna detalles de analista específico.

---

## Dashboard 3: Programas (2 endpoints)

### GET /api/v1/dashboard/programs-summary
Retorna consolidado de 5 programas.

---

### GET /api/v1/dashboard/program/{code}/detail
Retorna detalle de programa específico.

---

## Dashboard 4: Vulnerabilidades - 4-Drill (13 endpoints)

### GET /api/v1/dashboard/vuln-global
Nivel 0 (Global): 6 tarjetas motores, semáforo, tendencia, pipeline, subdirecciones.

---

### GET /api/v1/dashboard/vuln-subdireccion/{id}
Nivel 1 (Subdirección).

---

### GET /api/v1/dashboard/vuln-celula/{id}
Nivel 2 (Célula).

---

### GET /api/v1/dashboard/vuln-repositorio/{id}/sast
Nivel 3, Tab SAST.

---

### GET /api/v1/dashboard/vuln-repositorio/{id}/dast
Nivel 3, Tab DAST.

---

### GET /api/v1/dashboard/vuln-repositorio/{id}/sca
Nivel 3, Tab SCA.

---

### GET /api/v1/dashboard/vuln-repositorio/{id}/mast-mda
Nivel 3, Tab MAST/MDA.

---

### GET /api/v1/dashboard/vuln-repositorio/{id}/secrets
Nivel 3, Tab Secretos.

---

### GET /api/v1/dashboard/vuln-repositorio/{id}/cds
Nivel 3, Tab CDS.

---

### GET /api/v1/dashboard/vuln-repositorio/{id}/historial
Nivel 3, Tab Historial.

---

### GET /api/v1/dashboard/vuln-repositorio/{id}/config
Nivel 3, Tab Configuración.

---

### GET /api/v1/dashboard/vuln-repositorio/{id}/resumen
Nivel 3, Tab Resumen Agregado.

---

### GET /api/v1/dashboard/vuln-repositorio/{id}/detail
Información completa del repositorio.

---

## Dashboard 5: Concentrado (3 endpoints)

### GET /api/v1/dashboard/vuln-concentrated/by-motor
Vulnerabilidades agrupadas por motor.

---

### GET /api/v1/dashboard/vuln-concentrated/by-severity
Vulnerabilidades agrupadas por severidad.

---

### GET /api/v1/dashboard/vuln-concentrated/table
Tabla con filtros avanzados.

---

## Dashboard 6: Operación (3 endpoints)

### GET /api/v1/dashboard/releases-table
Tabla de liberaciones.

---

### GET /api/v1/dashboard/releases-terceros
Tabla de terceros.

---

### GET /api/v1/dashboard/release/{id}/detail
Detalle de release específico.

---

## Dashboard 7: Kanban (3 endpoints)

### GET /api/v1/dashboard/release-kanban-columns
Columnas configuradas.

---

### GET /api/v1/dashboard/releases-kanban
Datos del kanban.

---

### PATCH /api/v1/service-releases/{id}/move
Mover release entre columnas (drag-drop).

---

## Dashboard 8: Iniciativas (2 endpoints)

### GET /api/v1/dashboard/initiatives-summary
KPIs + lista de iniciativas.

---

### GET /api/v1/dashboard/initiative/{id}/detail
Detalle + ponderación.

---

## Dashboard 9: Temas Emergentes (2 endpoints)

### GET /api/v1/dashboard/emerging-themes-summary
KPIs + lista de temas.

---

### GET /api/v1/dashboard/tema/{id}/detail
Detalle + bitácora.

---

## TOTAL: 35 ENDPOINTS

**Estructura esperada (todo debe estar bajo `/api/v1/dashboards/` o patrones similares)**

Todos los endpoints deben:
- Retornar envelope: `{status, data, error?}`
- Aplicar soft delete
- Validar permisos
- Manejar paginación
- Response time < 2 segundos
