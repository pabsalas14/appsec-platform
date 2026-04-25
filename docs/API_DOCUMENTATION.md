# AppSec Platform — API Documentation

## Base URL

```
Production: https://appsec.example.com/api/v1
Development: http://localhost:8000/api/v1
```

## Authentication

All API requests require authentication via **HttpOnly cookies** with CSRF double-submit token validation.

### Login

```bash
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@example.com",
    "roles": ["super_admin"]
  }
}
```

### Refresh Token

```bash
POST /auth/refresh
Response: { "access_token": "..." }
```

### Logout

```bash
POST /auth/logout
Response: { "message": "Logged out successfully" }
```

---

## Response Format

All responses follow a standard envelope structure:

### Success Response
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation completed successfully"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total": 1250,
    "total_pages": 25,
    "has_next": true,
    "has_prev": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "INVALID_REQUEST",
  "message": "Validation error",
  "details": {
    "severidad": "Invalid enum value"
  }
}
```

---

## Core Endpoints

### Vulnerabilities (Module 9)

#### List Vulnerabilities
```bash
GET /vulnerabilities?page=1&page_size=50&severidad=CRITICAL&estado=OPEN

Query Parameters:
  page: int (default: 1)
  page_size: int (default: 50, max: 100)
  severidad: enum (CRITICAL, HIGH, MEDIUM, LOW)
  estado: enum (OPEN, IN_PROGRESS, REMEDIATED, CLOSED)
  motor: enum (SAST, DAST, SCA, TM, MAST)
  asignado_a: uuid (user_id)
  fecha_desde: ISO8601 date
  fecha_hasta: ISO8601 date
  buscar: string (title/description search)
  ordenar_por: string (created_at, sla_dias, severidad)
  orden: enum (ASC, DESC)

Response: Paginated list of vulnerabilities
```

#### Get Vulnerability Detail
```bash
GET /vulnerabilities/{id}

Response:
{
  "id": "uuid",
  "titulo": "SQL Injection in login form",
  "descripcion": "Input validation missing...",
  "severidad": "CRITICAL",
  "cvss": 9.8,
  "cwe": "CWE-89",
  "owasp": "A03:2021 – Injection",
  "motor": "SAST",
  "estado": "OPEN",
  "fecha_creacion": "2026-04-25T10:30:00Z",
  "fecha_vencimiento_sla": "2026-05-02T10:30:00Z",
  "dias_restantes_sla": 7,
  "semaforo": "YELLOW",
  "asignado_a": { "id": "uuid", "nombre": "Juan" },
  "creado_por": { "id": "uuid", "nombre": "Admin" },
  "historial": [ /* status changes */ ]
}
```

#### Create Vulnerability
```bash
POST /vulnerabilities
Content-Type: application/json

{
  "titulo": "SQL Injection in login",
  "descripcion": "Input validation missing in login form",
  "severidad": "CRITICAL",
  "cvss": 9.8,
  "cwe": "CWE-89",
  "owasp": "A03:2021",
  "motor": "SAST",
  "celula_id": "uuid",
  "justificacion": "Found during SAST scan"
}

Response: { "success": true, "data": { /* vulnerability object */ } }
```

#### Update Vulnerability Status
```bash
PATCH /vulnerabilities/{id}
Content-Type: application/json

{
  "estado": "IN_PROGRESS",
  "asignado_a_id": "uuid",
  "justificacion": "Assigned to senior developer"
}

Response: { "success": true, "data": { /* updated vulnerability */ } }
```

#### Bulk Operations
```bash
POST /vulnerabilities/bulk/assign
Content-Type: application/json

{
  "vulnerability_ids": ["uuid1", "uuid2", "uuid3"],
  "asignado_a_id": "uuid",
  "justificacion": "Bulk reassignment"
}

POST /vulnerabilities/bulk/status-change
Content-Type: application/json

{
  "vulnerability_ids": ["uuid1", "uuid2"],
  "nuevo_estado": "REMEDIATED",
  "justificacion": "Batch remediation"
}

Limits: 500 vulnerabilities max per operation
```

### Programs (Module 3-4)

#### SAST Programs
```bash
GET /programas-sast?page=1&estado=ACTIVE
POST /programas-sast
PATCH /programas-sast/{id}
DELETE /programas-sast/{id}
```

#### Program Activities
```bash
GET /programas-sast/{id}/actividades?mes=2026-04
POST /programas-sast/{id}/actividades
  {
    "mes": "2026-04",
    "repositorio_id": "uuid",
    "hallazgos_encontrados": 25,
    "hallazgos_remedied": 10
  }
```

### Threat Modeling (Module 3.3)

#### Create Session
```bash
POST /sesiones-threat-modeling
Content-Type: application/json

{
  "nombre": "TM - Payment Service",
  "descripcion": "Threat modeling for payment processing",
  "celula_id": "uuid",
  "tecnologia_stack": ["Java", "Spring Boot", "PostgreSQL", "Stripe API"]
}

Response: { "success": true, "data": { "id": "uuid", ... } }
```

#### Generate Threats (IA Integration)
```bash
POST /sesiones-threat-modeling/{id}/ia/suggest

Response:
{
  "success": true,
  "data": {
    "amenazas": [
      {
        "stride_category": "Tampering",
        "amenaza": "Attacker modifies payment amount in transit",
        "dread_scores": {
          "damage": 10,
          "reproducibility": 7,
          "exploitability": 6,
          "affected_users": 9,
          "discoverability": 5
        },
        "dread_total": 52,
        "controles_sugeridos": ["TLS encryption", "API validation"]
      }
    ]
  }
}
```

### Service Releases (Module 8.1)

#### Create Release
```bash
POST /service-releases
Content-Type: application/json

{
  "servicio_id": "uuid",
  "version": "2.1.0",
  "descripcion": "Payment validation improvements",
  "fecha_planeada": "2026-05-15",
  "celula_id": "uuid"
}

Response: { "id": "uuid", "estado": "DESIGN_REVIEW", ... }
```

#### Update Release Status
```bash
PATCH /service-releases/{id}/estado
Content-Type: application/json

{
  "nuevo_estado": "SECURITY_VALIDATION",
  "justificacion": "Design review completed"
}

Valid transitions:
DESIGN_REVIEW → SECURITY_VALIDATION
SECURITY_VALIDATION → SECURITY_TESTS  
SECURITY_TESTS → APPROVAL
APPROVAL → QA
QA → PRODUCTION

Note: Requires approve_release permission for APPROVAL stage
Note: SoD applies if configured (approval user != creator user)
```

### Dashboards & Indicators (Module 10-11)

#### Get Indicators
```bash
GET /indicadores?motor=SAST&periodo=2026-04

Response:
{
  "success": true,
  "data": [
    {
      "codigo": "SAST-001",
      "nombre": "Vulnerabilities Identified",
      "valor": 45,
      "valor_anterior": 38,
      "tendencia": "UP",
      "semaforo": "YELLOW",
      "sla_dias": 30
    }
  ]
}
```

#### Get Dashboard Data
```bash
GET /dashboards/ejecutivo?organización_id=uuid&periodo=2026-04

Response:
{
  "success": true,
  "data": {
    "kpis": {
      "total_vulnerabilities": 850,
      "critical": 15,
      "high": 45,
      "medium": 120,
      "low": 670
    },
    "sla_compliance": 92.5,
    "releases_pending": 8,
    "threat_modeling_sessions": 12
  }
}
```

### CSV Import (Module 9)

#### Upload CSV
```bash
POST /vulnerabilities/import/csv
Content-Type: multipart/form-data

Request:
  file: <CSV file>
  mapper_config: {
    "titulo": "vulnerability_name",
    "descripcion": "description",
    "severidad": "severity",
    "motor": "tool_name"
  }

Response:
{
  "success": true,
  "data": {
    "preview": [
      { "titulo": "...", "severidad": "CRITICAL", "motor": "SAST" }
    ],
    "total_rows": 45,
    "duplicates_detected": 3,
    "invalid_rows": 1
  }
}
```

#### Confirm Import
```bash
POST /vulnerabilities/import/csv/confirm
Content-Type: application/json

{
  "import_session_id": "uuid",
  "auto_assign_to": "uuid",
  "action": "IMPORT"
}

Response:
{
  "success": true,
  "data": {
    "created": 42,
    "skipped_duplicates": 3,
    "skipped_invalid": 0,
    "import_id": "uuid"
  }
}
```

### Exports

#### Export Vulnerabilities to CSV
```bash
POST /vulnerabilities/export/csv
Content-Type: application/json

{
  "filters": {
    "severidad": "CRITICAL",
    "estado": "OPEN",
    "motor": "SAST"
  },
  "columns": ["id", "titulo", "severidad", "sla_dias", "asignado_a"]
}

Response: CSV file (application/csv)
Header: Content-Disposition: attachment; filename="vulnerabilities_20260425.csv"
```

#### Export to Excel
```bash
POST /dashboards/{dashboard_id}/export/excel
```

#### Export to PDF
```bash
POST /releases/export/pdf
Content-Type: application/json

{
  "release_ids": ["uuid1", "uuid2"],
  "include_timeline": true
}

Response: PDF file (application/pdf)
```

### Audit Logs (Module T1)

#### List Audit Events
```bash
GET /audit-logs?page=1&page_size=50&entidad=Vulnerabilidad&accion=CREATE&fecha_desde=2026-04-20

Query Parameters:
  entidad: string (Vulnerabilidad, ServiceRelease, etc.)
  accion: enum (CREATE, UPDATE, DELETE, APPROVE, EXPORT)
  usuario_id: uuid
  fecha_desde: ISO8601
  fecha_hasta: ISO8601
  exitoso: bool

Response: Paginated audit events with user, action, timestamp, changes
```

#### Verify Audit Integrity
```bash
GET /admin/audit-logs/verify-integrity

Response:
{
  "success": true,
  "data": {
    "total_records": 45000,
    "hash_chain_valid": true,
    "first_record_hash": "abc123...",
    "last_record_hash": "xyz789...",
    "tampered_records": 0
  }
}
```

### Configuration (Module 2 + Admin Panel)

#### Get Configuration
```bash
GET /admin/system-configuration

Response:
{
  "success": true,
  "data": {
    "catalogs": {
      "tipos_programa": ["SAST", "DAST", "TM", "MAST"],
      "severidades": ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    },
    "slas": {
      "CRITICAL": 7,
      "HIGH": 30,
      "MEDIUM": 60,
      "LOW": 90
    },
    "roles": [
      { "id": "uuid", "nombre": "super_admin", "permisos": [...] }
    ]
  }
}
```

#### Update Configuration
```bash
PUT /admin/system-configuration
Content-Type: application/json

{
  "key": "sla.severidades",
  "value": { "CRITICAL": 5, "HIGH": 20, ... }
}

Note: Requires super_admin role
Note: Change logged to audit trail with diff
```

### IA Integration Configuration

#### Get IA Config
```bash
GET /admin/ia-config

Response:
{
  "success": true,
  "data": {
    "ai_provider": "ollama",
    "ai_model": "llama3.1:8b",
    "ai_temperature": 0.7,
    "ai_max_tokens": 2000,
    "ai_timeout_seconds": 30,
    "data_sanitization_enabled": false,
    "test_status": "healthy"
  }
}
```

#### Update IA Config
```bash
PUT /admin/ia-config
Content-Type: application/json

{
  "ai_provider": "anthropic",
  "ai_model": "claude-sonnet-4-6",
  "ai_temperature": 0.3,
  "data_sanitization_enabled": true
}

Note: Requires super_admin role
```

#### Test IA Provider
```bash
POST /admin/ia-config/test-connection

Response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "provider": "anthropic",
    "response_time_ms": 245
  }
}
```

---

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_REQUEST | 400 | Validation error |
| UNAUTHORIZED | 401 | Authentication failed |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists / State conflict |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

```
Global: 1000 requests/minute per IP
CSV Import: 10 imports/hour per user
Bulk Operations: 100 operations/hour per user
Exports: 50 exports/hour per user
Login: 10 attempts/minute per username
```

---

## Pagination

All list endpoints support pagination:

```bash
GET /endpoint?page=2&page_size=50

Response includes:
{
  "pagination": {
    "page": 2,
    "page_size": 50,
    "total": 1250,
    "total_pages": 25,
    "has_next": true,
    "has_prev": true
  }
}
```

**Defaults:** page_size = 50, max = 100

---

## Headers

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <token>  (if using JWT in URL params)
X-CSRF-Token: <token>  (for POST/PATCH/DELETE)
```

### Response Headers
```
X-Request-ID: <uuid>  (for tracing)
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1724086800
Cache-Control: no-store
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

---

## OpenAPI/Swagger

Interactive API documentation available at:
- Development: http://localhost:8000/docs
- Production: https://appsec.example.com/docs

---

**Last Updated:** April 2026
**Version:** 1.0.0
