# FASE 8 - AI Automation Rules (Implementación Completa)

## Resumen

La **Fase 8** implementa un sistema completo de **automatización impulsada por IA** donde los administradores pueden crear reglas que automaticen acciones basadas en eventos.

## Características

### Trigger Types (6 tipos)
- `on_vulnerability_created` - Se dispara cuando se crea una vulnerabilidad
- `on_vulnerability_status_changed` - Se dispara cuando cambia el estado de una vulnerabilidad
- `on_release_created` - Se dispara cuando se crea un release
- `on_theme_created` - Se dispara cuando se crea un tema emergente
- `on_sla_at_risk` - Se dispara cuando un SLA está en riesgo
- `cron` - Se dispara según un cronograma

### Action Types (7 tipos)
- `send_notification` - Envía una notificación a usuarios
- `create_ticket` - Crea un ticket en un sistema externo
- `assign_to_user` - Asigna la entidad a un usuario
- `tag_entity` - Agrega tags a la entidad
- `generate_summary` - Usa LLM para generar un resumen
- `enrich_data` - Usa LLM para enriquecer datos
- `suggest_fix` - Usa LLM para sugerir remedios

## Backend API (6 Endpoints)

### 1. POST /api/v1/admin/ai-rules
**Crear una nueva regla de IA**

```bash
curl -X POST http://localhost:8000/api/v1/admin/ai-rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Critical Vuln Alert",
    "description": "Generar summary y enviar notificación",
    "trigger_type": "on_vulnerability_created",
    "trigger_config": {
      "severity": "critical",
      "source": "all"
    },
    "action_type": "generate_summary",
    "action_config": {
      "prompt_template": "Resume esta vulnerabilidad crítica",
      "max_tokens": 500
    },
    "enabled": true,
    "max_retries": 3,
    "timeout_seconds": 30
  }'
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Critical Vuln Alert",
    "trigger_type": "on_vulnerability_created",
    "trigger_config": { "severity": "critical", "source": "all" },
    "action_type": "generate_summary",
    "action_config": { "prompt_template": "...", "max_tokens": 500 },
    "enabled": true,
    "max_retries": 3,
    "timeout_seconds": 30,
    "created_by": "user-id",
    "created_at": "2026-04-25T23:45:00Z",
    "updated_at": "2026-04-25T23:45:00Z"
  }
}
```

### 2. GET /api/v1/admin/ai-rules
**Listar reglas (con filtros y paginación)**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/ai-rules?skip=0&limit=20&trigger_type=on_vulnerability_created&enabled=true"
```

**Query Parameters:**
- `skip` (int): Offset para paginación (default: 0)
- `limit` (int): Límite de resultados (default: 20, max: 100)
- `search` (str): Buscar por nombre (opcional)
- `trigger_type` (str): Filtrar por tipo de trigger (opcional)
- `action_type` (str): Filtrar por tipo de acción (opcional)
- `enabled` (bool): Filtrar por estado (opcional)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "items": [
      { /* AIRuleRead */ },
      { /* AIRuleRead */ }
    ],
    "total": 5,
    "page": 0,
    "per_page": 20
  }
}
```

### 3. GET /api/v1/admin/ai-rules/{rule_id}
**Obtener una regla específica**

```bash
curl -X GET http://localhost:8000/api/v1/admin/ai-rules/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": { /* AIRuleRead */ }
}
```

### 4. PATCH /api/v1/admin/ai-rules/{rule_id}
**Actualizar una regla**

```bash
curl -X PATCH http://localhost:8000/api/v1/admin/ai-rules/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false,
    "action_config": {
      "prompt_template": "Nuevo prompt"
    }
  }'
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": { /* AIRuleRead actualizado */ }
}
```

### 5. DELETE /api/v1/admin/ai-rules/{rule_id}
**Eliminar una regla (soft delete)**

```bash
curl -X DELETE http://localhost:8000/api/v1/admin/ai-rules/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": { "deleted": true }
}
```

### 6. POST /api/v1/admin/ai-rules/{rule_id}/test
**Testear una regla (dry-run sin persistencia)**

```bash
curl -X POST http://localhost:8000/api/v1/admin/ai-rules/550e8400-e29b-41d4-a716-446655440000/test \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "vulnerability_id": "test-vuln-1",
      "severity": "critical"
    }
  }'
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "rule_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "success",
    "message": "Test executed successfully. Rule would trigger on on_vulnerability_created and execute generate_summary.",
    "dry_run": true,
    "execution_time_ms": 125.5
  }
}
```

## Endpoints Metadata (Utilitarios)

### GET /api/v1/admin/ai-rules/metadata/triggers
**Obtener tipos de triggers disponibles**

```bash
curl -X GET http://localhost:8000/api/v1/admin/ai-rules/metadata/triggers
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "triggers": [
      {
        "id": "on_vulnerability_created",
        "label": "Vulnerability Created",
        "description": "Triggers when a new vulnerability is created",
        "configurable_fields": ["severity", "source"]
      },
      ...
    ]
  }
}
```

### GET /api/v1/admin/ai-rules/metadata/actions
**Obtener tipos de acciones disponibles**

```bash
curl -X GET http://localhost:8000/api/v1/admin/ai-rules/metadata/actions
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "actions": [
      {
        "id": "send_notification",
        "label": "Send Notification",
        "description": "Send a notification to users",
        "configurable_fields": ["message_template", "recipients", "channels"]
      },
      ...
    ]
  }
}
```

## Frontend Admin UI

### Ubicación
`/admin/ai-rules`

### Secciones

#### 1. Automation Rules (Tab principal)
- **Listado de reglas** en cards con vista de trigger/action
- **Búsqueda y filtros** por nombre, estado (enabled/disabled), tipo de trigger/acción
- **Acciones por regla**: Edit, Test, Delete
- **Toggle para habilitar/deshabilitar** directamente desde la card
- **Paginación** con botones Previous/Next

#### 2. IA Configuration (Tab)
- Enlace a la sección de configuración de proveedores de IA
- Selector de provider (Anthropic/OpenAI)
- Input para API key
- Selector de modelo
- Inputs para temperatura y max_tokens
- Botón para guardar/actualizar

### Dialog de Edición/Creación

El dialog contiene:
1. **Basic Info**
   - Rule Name (required)
   - Description (optional)

2. **Trigger Configuration**
   - Trigger Type selector (dropdown con 6 opciones)
   - Campos configurables dinámicos según el trigger seleccionado
   - Descripción contextual

3. **Action Configuration**
   - Action Type selector (dropdown con 7 opciones)
   - Campos configurables dinámicos según la acción seleccionada
   - Descripción contextual

4. **Advanced Settings**
   - Max Retries (0-10)
   - Timeout (5-300 segundos)
   - Enable/Disable toggle

5. **Botones**
   - Create Rule / Update Rule (según contexto)
   - Cancel

## Ejemplos de Casos de Uso

### Caso 1: Generar Summary para Vulnerabilidades Críticas
```javascript
{
  "name": "Critical Vulnerability Summary",
  "trigger_type": "on_vulnerability_created",
  "trigger_config": { "severity": "critical" },
  "action_type": "generate_summary",
  "action_config": {
    "prompt_template": "Genera un resumen ejecutivo de esta vulnerabilidad crítica",
    "max_tokens": 500
  }
}
```

### Caso 2: Asignar a On-Call Analyst cuando SLA está en Riesgo
```javascript
{
  "name": "SLA At Risk - Auto Assign",
  "trigger_type": "on_sla_at_risk",
  "trigger_config": { "hours_remaining": 4 },
  "action_type": "assign_to_user",
  "action_config": {
    "user_id": "on-call-analyst-id",
    "priority": "high"
  }
}
```

### Caso 3: Scheduled Weekly Report
```javascript
{
  "name": "Weekly Security Report",
  "trigger_type": "cron",
  "trigger_config": { "cron_expression": "0 9 * * 1" },
  "action_type": "generate_summary",
  "action_config": {
    "prompt_template": "Genera reporte semanal de seguridad",
    "max_tokens": 2000
  }
}
```

### Caso 4: Sugerir Fix para Release en Producción
```javascript
{
  "name": "Production Release - Suggest Fix",
  "trigger_type": "on_release_created",
  "trigger_config": { "environment": "production" },
  "action_type": "suggest_fix",
  "action_config": {
    "context_fields": ["vulnerability_type", "affected_component"],
    "prompt_template": "Sugiere pasos de remediación para este release en producción"
  }
}
```

## Validación y Reglas

1. **Trigger Type y Action Type** deben ser valores válidos del enum
2. **Rule Name** es requerido y debe tener entre 1-255 caracteres
3. **Trigger Config y Action Config** son JSONB - pueden ser cualquier estructura JSON válida
4. **Max Retries** debe estar entre 0-10
5. **Timeout** debe estar entre 5-300 segundos
6. **Enabled** es un booleano (default: true)

## Auditoría

Todas las operaciones se registran en `audit_logs`:
- `ai_rule.create` - Cuando se crea una regla
- `ai_rule.update` - Cuando se actualiza una regla
- `ai_rule.delete` - Cuando se elimina una regla

El campo `created_by` rastrea quién creó la regla.

## Base de Datos

### Tabla: `ai_rules`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | UUID | NO | Primary key |
| name | String(255) | NO | Nombre de la regla |
| description | Text | SÍ | Descripción opcional |
| trigger_type | String(128) | NO | Tipo de trigger (indexed) |
| trigger_config | JSONB | NO | Configuración del trigger |
| action_type | String(128) | NO | Tipo de acción (indexed) |
| action_config | JSONB | NO | Configuración de la acción |
| enabled | Boolean | NO | Si la regla está habilitada (indexed) |
| max_retries | Integer | NO | Máximo de reintentos (default: 3) |
| timeout_seconds | Integer | NO | Timeout en segundos (default: 30) |
| created_by | UUID | SÍ | FK a users.id |
| created_at | DateTime | NO | Timestamp de creación |
| updated_at | DateTime | NO | Timestamp de última actualización |
| deleted_at | DateTime | SÍ | Soft delete timestamp |
| deleted_by | UUID | SÍ | FK a users.id para soft delete |

### Índices
- `ix_ai_rules_trigger_type`
- `ix_ai_rules_action_type`
- `ix_ai_rules_enabled`
- `ix_ai_rules_created_by`
- `ix_ai_rules_trigger_enabled` (composite, partial)
- `ix_ai_rules_action_enabled` (composite, partial)

## Testing

Ejecutar los tests de FASE 8:
```bash
cd backend
pytest tests/test_ai_rules.py -v
```

O ejecutar todos los tests de contrato:
```bash
make test
```

## Archivo de Migración

`backend/alembic/versions/h2i3j4k5l6m7_phase8_ai_rules_complete.py`

Ejecutar migración:
```bash
docker compose exec backend alembic upgrade head
```

## Notas Importantes

1. **Soft Delete**: Las reglas se eliminan con soft delete (se marca `deleted_at`)
2. **Ownership**: No es una entidad "owned" por usuarios individuales - es admin-global
3. **No llama a `db.commit()`**: El servicio usa `flush()` como per ADR-0003
4. **Auditoría registrada**: Todas las mutaciones crean entradas en audit_logs
5. **Validación de tipos**: Se valida contra enums permitidos antes de persistir

## Completitud FASE 8

✅ 6 endpoints backend implementados
✅ Page admin `/admin/ai-rules` con 2 tabs
✅ Rule builder visual con forms dinámicas
✅ IA Configuration tab
✅ Test/dry-run endpoint funcional
✅ Hooks frontend con React Query
✅ Tipos TypeScript completos
✅ Validación en backend y frontend
✅ Migración Alembic
✅ Documentación y ejemplos
✅ Tests básicos

**FASE 8 - 100% FUNCIONAL** ✨
