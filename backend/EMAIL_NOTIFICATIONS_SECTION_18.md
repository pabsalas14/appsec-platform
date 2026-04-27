# Email Notifications Implementation (S18)

## Overview

Complete email notification system with SMTP support, retry logic, rate limiting, and async queue integration. Supports 5+ notification types with user preferences.

## Architecture

### Components

1. **EmailService** (`app/services/email_service.py`)
   - SMTP client with TLS support
   - Retry logic with exponential backoff (max 3 attempts)
   - Rate limiting (max 100 emails/min)
   - Audit logging to `email_logs` table

2. **EmailTemplate Model** (`app/models/email_template.py`)
   - Stores HTML templates with variable interpolation
   - Templates pre-loaded via seed data
   - Format: `{{ variable_name }}` for interpolation

3. **EmailLog Model** (`app/models/email_log.py`)
   - Audit trail for all email delivery attempts
   - Tracks: status, retry count, error messages, timestamps
   - States: `pendiente` → `enviado` | `fallido`

4. **NotificationDispatcher** (`app/services/notification_dispatcher.py`)
   - Routes notifications to in-app and/or email channels
   - Respects user preferences per channel
   - Single unified interface for all notification types

5. **UserPreferencesService** (`app/services/user_preferences_service.py`)
   - Per-user channel preferences (in-app, email)
   - Per-notification-type settings
   - Global enable/disable flags
   - Digest options (immediato vs diario)

6. **CeleryTasksManager** (`app/services/celery_tasks.py`)
   - Async email send queue
   - Periodic retry task for failed emails
   - Optional log cleanup task

### API Endpoints

#### Email Templates (Admin Only)

```
GET    /api/v1/email-templates              # List all templates
POST   /api/v1/email-templates              # Create template
GET    /api/v1/email-templates/{id}         # Get template
PATCH  /api/v1/email-templates/{id}         # Update template
DELETE /api/v1/email-templates/{id}         # Delete template
```

#### User Preferences

```
GET    /api/v1/user-preferences             # Get current user prefs
PATCH  /api/v1/user-preferences             # Update preferences
POST   /api/v1/user-preferences/email/enable   # Enable email for types
POST   /api/v1/user-preferences/email/disable  # Disable email for types
```

### Database Schema

#### email_templates

```sql
CREATE TABLE email_templates (
    id UUID PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE,      -- sla_vencida, vulnerabilidad_critica, etc.
    asunto VARCHAR(255),              -- Email subject
    cuerpo_html TEXT,                 -- HTML body
    variables JSONB,                  -- ["titulo", "descripcion", "enlace"]
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);
```

#### email_logs

```sql
CREATE TABLE email_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    notificacion_id UUID REFERENCES notificacions,
    email_template_id UUID REFERENCES email_templates,
    destinatario VARCHAR(255),
    asunto VARCHAR(255),
    estado ENUM('pendiente', 'enviado', 'fallido'),
    reintentos INT DEFAULT 0,
    error_mensaje TEXT,
    ultimo_intento_at TIMESTAMPTZ,
    enviado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);
```

## Configuration

### Environment Variables

```bash
# Email service (required for email functionality)
EMAIL_ENABLED=true
SMTP_HOST=smtp.company.com
SMTP_PORT=587
SMTP_USER=notifications@company.com
SMTP_PASSWORD=***
SMTP_FROM_EMAIL=notifications@appsec.local
SMTP_FROM_NAME=AppSec Platform
SMTP_USE_TLS=true

# Retry configuration
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY_SECONDS=60
EMAIL_RATE_LIMIT_PER_MIN=100

# Async worker (if using Celery/APScheduler)
SCHEDULE_EMAIL_WORKER=true
EMAIL_WORKER_CRON_HOUR_UTC=0
EMAIL_WORKER_CRON_MINUTE_UTC=0
```

## Pre-loaded Templates

1. **sla_vencida** - SLA expiration alert
   - Variables: vulnerabilidad_id, fuente, severidad, fecha_limite, responsable, enlace_dashboard

2. **vulnerabilidad_critica** - Critical vulnerability detected
   - Variables: titulo, severidad, aplicacion, fuente, descripcion, enlace_dashboard

3. **excepcion_temporal_aprobada** - Exception approved
   - Variables: vulnerabilidad_id, tipo_excepcion, fecha_inicio, fecha_vencimiento, justificacion, aprobador, enlace_detalles

4. **tema_emergente_actualizado** - Emerging topic updated
   - Variables: titulo, estado, tipo, ultima_entrada, responsable, enlace_tema

5. **iniciativa_hito_completado** - Initiative milestone completed
   - Variables: iniciativa_titulo, hito_nombre, fecha_planificada, fecha_completada, progreso, enlace_iniciativa

6. **tema_estancado** - Emerging topic stalled (30+ days no updates)
   - Variables: titulo, dias, estado, tipo, ultima_actividad, responsable, enlace_tema

7. **vulnerabilidad_inactiva** - Vulnerability inactive (60+ days no updates)
   - Variables: vulnerabilidad_id, dias, titulo, estado, severidad, ultima_actualizacion, responsable, enlace_dashboard

## Usage Examples

### Send Email via API

```python
from app.services.email_service import email_service
from sqlalchemy.ext.asyncio import AsyncSession

async def send_alert(db: AsyncSession, user_id: uuid.UUID):
    email_log = await email_service.send_email(
        db,
        destinatario="user@company.com",
        template_nombre="sla_vencida",
        variables={
            "vulnerabilidad_id": "vuln-123",
            "fuente": "SAST",
            "severidad": "Crítica",
            "fecha_limite": "2026-04-30",
            "responsable": "John Doe",
            "enlace_dashboard": "https://appsec.local/vuln/123"
        },
        user_id=user_id
    )
    # Email queued for delivery
    return email_log
```

### Dispatch Notification (In-App + Email)

```python
from app.services.notification_dispatcher import notification_dispatcher

async def notify_sla_expiration(db: AsyncSession, user_id: uuid.UUID):
    result = await notification_dispatcher.dispatch(
        db,
        user_id=user_id,
        notification_type="sla_vencida",
        titulo="Vulnerabilidad excede SLA",
        cuerpo="La vulnerabilidad vuln-123 excede el SLA",
        email_template_nombre="sla_vencida",
        email_variables={
            "vulnerabilidad_id": "vuln-123",
            "fuente": "SAST",
            # ... other variables
        }
    )
    # {"channels_sent": ["in_app", "email"], "in_app": Notificacion, "email": EmailLog}
    return result
```

### User Preferences

```python
from app.services.user_preferences_service import user_preferences_svc

# Get user preferences
prefs = await user_preferences_svc.get_preferences(db, user_id)

# Enable email for all types
await user_preferences_svc.enable_email_channel(
    db,
    user_id,
    all_types=True
)

# Enable for specific types
await user_preferences_svc.enable_email_channel(
    db,
    user_id,
    notification_types=["sla_vencida", "vulnerabilidad_critica"]
)

# Check if channel enabled for notification
is_enabled = await user_preferences_svc.is_channel_enabled(
    db,
    user_id,
    "sla_vencida",
    "email"
)
```

### Retry Failed Emails

```python
# Manual retry
result = await email_service.retry_failed_emails(
    db,
    max_age_minutes=1440  # 24 hours
)
# {"retried": 5, "success": 3, "failed": 2}
```

## Notification Types

The system supports these notification types in user preferences:

- `sla_vencida` - SLA expiration alert
- `vulnerabilidad_critica` - Critical vulnerability
- `excepcion_temporal` - Exception approval/update
- `tema_emergente_actualizado` - Emerging topic update
- `iniciativa_hito_completado` - Milestone completion
- `tema_estancado` - Stalled emerging topic
- `vulnerabilidad_inactiva` - Inactive vulnerability

## Integration with Rules Engine

The `notification_rules_runner.py` has been designed to work with NotificationDispatcher:

```python
# Update rule to use dispatcher
async def run_notification_rules_sla_riesgo(db: AsyncSession):
    # ... existing query logic ...
    for v in rows:
        await notification_dispatcher.dispatch(
            db,
            user_id=uid,
            notification_type="sla_vencida",
            titulo=f"[SLA] Vulnerabilidad {v.id}: revisión antes de {v.fecha_limite_sla.date()}",
            cuerpo=f"Fuente {v.fuente}, severidad {v.severidad}.",
            email_template_nombre="sla_vencida",
            email_variables={
                "vulnerabilidad_id": str(v.id),
                "fuente": v.fuente,
                "severidad": v.severidad,
                "fecha_limite": v.fecha_limite_sla.date().isoformat(),
                "responsable": u.full_name or u.username,
                "enlace_dashboard": f"https://appsec.local/vulnerabilidades/{v.id}"
            }
        )
```

## Async/Queue Setup (Optional)

### With Celery

```python
# celery_app.py
from celery import Celery

app = Celery("appsec")
app.conf.broker_url = "redis://localhost:6379"
app.conf.result_backend = "redis://localhost:6379"

@app.task
def send_email_task(email_log_id: str):
    return await celery_tasks_mgr.send_email_async(email_log_id)

@app.task
def retry_emails_task():
    return await celery_tasks_mgr.retry_pending_emails()

# In main app startup
from celery.schedules import crontab
app.conf.beat_schedule = {
    'retry-emails-hourly': {
        'task': 'tasks.retry_emails_task',
        'schedule': crontab(minute=0),
    }
}
```

### With APScheduler

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

scheduler.add_job(
    celery_tasks_mgr.retry_pending_emails,
    'cron',
    hour=0,
    minute=0,
    id='retry_emails_hourly'
)

scheduler.start()
```

## Testing

### Unit Tests

```python
# tests/test_email_service.py
async def test_send_email(db: AsyncSession):
    email_log = await email_service.send_email(
        db,
        destinatario="test@example.com",
        template_nombre="sla_vencida",
        variables={"vulnerabilidad_id": "test-123", ...}
    )
    assert email_log.estado in ["pendiente", "enviado"]
    assert email_log.destinatario == "test@example.com"

async def test_user_preferences(db: AsyncSession):
    prefs = await user_preferences_svc.get_preferences(db, user_id)
    assert "email_notificaciones" in prefs
    assert prefs["notificaciones_automaticas"] is True
```

### Integration Tests

Run against real SMTP or mock:

```python
import pytest
from unittest.mock import patch

@pytest.mark.asyncio
async def test_dispatch_with_email(db: AsyncSession):
    with patch('app.services.email_service.email_service._send_smtp'):
        result = await notification_dispatcher.dispatch(
            db,
            user_id,
            "sla_vencida",
            "título",
            "cuerpo",
            email_template_nombre="sla_vencida",
            email_variables={...}
        )
        assert "email" in result["channels_sent"]
```

## Migration

Run Alembic migration to create tables:

```bash
alembic upgrade head
```

Then seed templates:

```python
from app.services.email_template_seed import seed_email_templates

async def init_db():
    async with AsyncSession(engine) as db:
        await seed_email_templates(db)
        await db.commit()
```

## Monitoring & Audit

### Email Log Queries

```sql
-- Failed emails
SELECT * FROM email_logs WHERE estado = 'fallido' ORDER BY updated_at DESC;

-- Recent sent emails
SELECT * FROM email_logs WHERE estado = 'enviado' 
  AND enviado_at > now() - interval '24 hours';

-- Emails pending retry
SELECT *, (max_retries - reintentos) as retries_left 
FROM email_logs WHERE estado = 'pendiente';

-- Delivery rate
SELECT estado, COUNT(*) FROM email_logs 
GROUP BY estado;
```

## Security Notes

1. **SMTP Credentials**: Store in environment variables only, never commit to git
2. **Email Interpolation**: Variables are HTML-escaped during interpolation (future enhancement)
3. **Rate Limiting**: Enforce at application layer (100 emails/min default)
4. **Audit Trail**: All sends logged with user, template, timestamp
5. **Access Control**: Template management restricted to admin role

## Future Enhancements

1. Unsubscribe links in emails
2. Batch/digest mode (collect and send daily)
3. Email template versioning
4. Bounce handling
5. Webhook notifications for delivery events
6. HTML escaping/sanitization in template interpolation
7. Custom email headers (X-Priority, etc.)
8. Attachment support
