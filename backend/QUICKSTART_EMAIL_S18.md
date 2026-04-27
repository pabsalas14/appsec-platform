# Email Notifications Quick Start (Section 18)

## 1. Configure Environment Variables

Add to `.env`:

```bash
# Email Service
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com          # or your SMTP provider
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password   # NOT your regular password, use app-specific
SMTP_FROM_EMAIL=notifications@appsec.local
SMTP_FROM_NAME=AppSec Platform
SMTP_USE_TLS=true

# Retry Configuration
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY_SECONDS=60
EMAIL_RATE_LIMIT_PER_MIN=100

# Async Worker (optional, for production)
SCHEDULE_EMAIL_WORKER=false
EMAIL_WORKER_CRON_HOUR_UTC=0
EMAIL_WORKER_CRON_MINUTE_UTC=0
```

## 2. Run Database Migration

```bash
# Inside backend directory
alembic upgrade head
```

This creates:
- `email_templates` table
- `email_logs` table
- Indexes for performance

## 3. Initialize Templates

The templates are auto-loaded on first app startup via `email_init.py`. 
If you need to manually initialize:

```python
# In your app startup
from app.services.email_init import init_email_notifications

async def startup_event():
    async with AsyncSession(engine) as db:
        await init_email_notifications(db)
```

## 4. Register API Routes

In your main FastAPI app:

```python
from fastapi import FastAPI
from app.api.v1 import email_template, user_preferences

app = FastAPI()

# Register routes
app.include_router(email_template.router)
app.include_router(user_preferences.router)
```

## 5. Test Email Sending

```bash
# Using Python CLI or test script
python -c "
import asyncio
from app.services.email_service import email_service
from app.database import get_session

async def test():
    async with get_session() as db:
        log = await email_service.send_email(
            db,
            destinatario='test@example.com',
            template_nombre='sla_vencida',
            variables={
                'vulnerabilidad_id': 'TEST-001',
                'fuente': 'SAST',
                'severidad': 'Alta',
                'fecha_limite': '2026-05-01',
                'responsable': 'John Doe',
                'enlace_dashboard': 'https://appsec.local/vuln/123'
            }
        )
        print(f'Email logged: {log.id}, estado: {log.estado}')

asyncio.run(test())
"
```

## 6. Enable Email for User (API)

```bash
# Enable email for specific notification types
curl -X POST http://localhost:8000/api/v1/user-preferences/email/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_types": ["sla_vencida", "vulnerabilidad_critica"]
  }'

# Or enable for all types
curl -X POST http://localhost:8000/api/v1/user-preferences/email/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "all_types": true
  }'
```

## 7. Send Notification (In-App + Email)

```python
from app.services.notification_dispatcher import notification_dispatcher

async def notify_user(db, user_id):
    result = await notification_dispatcher.dispatch(
        db,
        user_id=user_id,
        notification_type="sla_vencida",
        titulo="[SLA] Vulnerabilidad VULN-001 excede plazo",
        cuerpo="Acción requerida: revisar vulnerabilidad antes de 2026-05-01",
        email_template_nombre="sla_vencida",
        email_variables={
            "vulnerabilidad_id": "VULN-001",
            "fuente": "SAST",
            "severidad": "Crítica",
            "fecha_limite": "2026-05-01",
            "responsable": "John Doe",
            "enlace_dashboard": "https://appsec.local/vuln/vuln-001"
        }
    )
    
    print(f"Channels sent: {result['channels_sent']}")
    # Output: Channels sent: ['in_app', 'email']
```

## 8. Integration with Notification Rules (Existing)

Update your notification rules to use dispatcher:

```python
# In notification_rules_runner.py
async def run_notification_rules_sla_riesgo(db: AsyncSession):
    # ... existing query logic ...
    for v in rows:
        from app.services.notification_dispatcher import notification_dispatcher
        
        await notification_dispatcher.dispatch(
            db,
            user_id=uid,
            notification_type="sla_vencida",
            titulo=f"[SLA] Vulnerabilidad {v.id}: revisión antes de {v.fecha_limite_sla.date()}",
            cuerpo=f"Fuente {v.fuente}, severidad {v.severidad}",
            email_template_nombre="sla_vencida",
            email_variables={
                "vulnerabilidad_id": str(v.id),
                "fuente": v.fuente or "Desconocida",
                "severidad": v.severidad or "Media",
                "fecha_limite": v.fecha_limite_sla.date().isoformat(),
                "responsable": u.full_name or u.username or "Asignado",
                "enlace_dashboard": f"https://appsec.local/vulnerabilidades/{v.id}"
            }
        )
```

## 9. Setup Async Queue (Optional, for Production)

### Option A: Using APScheduler

```python
# In main.py or startup hooks
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.celery_tasks import celery_tasks_mgr

async def startup():
    scheduler = AsyncIOScheduler()
    
    # Retry failed emails hourly
    scheduler.add_job(
        celery_tasks_mgr.retry_pending_emails,
        'cron',
        hour='*',
        minute=0,
        id='retry_emails_hourly'
    )
    
    scheduler.start()
```

### Option B: Using Celery

```python
# celery_worker.py
from celery import Celery
from app.services.celery_tasks import celery_tasks_mgr

app = Celery("appsec_worker")
app.conf.broker_url = "redis://localhost:6379"
app.conf.result_backend = "redis://localhost:6379"

@app.task
def send_email_task(email_log_id: str):
    import asyncio
    return asyncio.run(celery_tasks_mgr.send_email_async(email_log_id))

@app.task
def retry_emails_task():
    import asyncio
    return asyncio.run(celery_tasks_mgr.retry_pending_emails())

# Set periodic task
from celery.schedules import crontab
app.conf.beat_schedule = {
    'retry-emails-hourly': {
        'task': 'celery_worker.retry_emails_task',
        'schedule': crontab(minute=0),
    }
}
```

## 10. Monitor Email Delivery

```bash
# Check email logs via SQL
psql $DATABASE_URL -c "
SELECT id, destinatario, estado, enviado_at, error_mensaje 
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 20;
"

# Count by status
psql $DATABASE_URL -c "
SELECT estado, COUNT(*) as total 
FROM email_logs 
GROUP BY estado;
"

# Find failed emails for retry
psql $DATABASE_URL -c "
SELECT id, destinatario, reintentos, error_mensaje 
FROM email_logs 
WHERE estado = 'fallido' 
ORDER BY updated_at DESC;
"
```

## Troubleshooting

### SMTP Connection Failed

Check credentials in `.env`:
```bash
python -c "
import smtplib
try:
    smtp = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
    smtp.starttls()
    smtp.login('your-email@gmail.com', 'your-app-password')
    print('✓ SMTP connection successful')
    smtp.quit()
except Exception as e:
    print(f'✗ SMTP error: {e}')
"
```

### Template Not Found

Verify templates exist:
```bash
psql $DATABASE_URL -c "
SELECT nombre, activo FROM email_templates;
"
```

If empty, manually seed:
```python
from app.services.email_template_seed import seed_email_templates
from app.database import get_session

async def seed():
    async with get_session() as db:
        await seed_email_templates(db)
        await db.commit()

import asyncio
asyncio.run(seed())
```

### Emails Not Sending

1. Check `EMAIL_ENABLED=true` in `.env`
2. Verify user preferences: `GET /api/v1/user-preferences`
3. Check email_logs table for errors:
   ```bash
   psql $DATABASE_URL -c "
   SELECT * FROM email_logs WHERE estado='fallido' LIMIT 1;
   "
   ```
4. Check app logs for `email_service` errors

## Next Steps

1. **Production Checklist**
   - [ ] Set `EMAIL_ENABLED=true`
   - [ ] Configure real SMTP (Gmail, SendGrid, etc.)
   - [ ] Enable async worker (APScheduler or Celery)
   - [ ] Set up error monitoring (Sentry, DataDog)
   - [ ] Test email delivery with real SMTP
   - [ ] Configure rate limits for your SMTP provider

2. **User Communication**
   - [ ] Send admin email to enable email notifications
   - [ ] Document notification preferences in help center
   - [ ] Add unsubscribe link option (future enhancement)

3. **Monitoring**
   - [ ] Create dashboard for email delivery metrics
   - [ ] Set up alerts for high failure rates
   - [ ] Monitor SMTP quota usage

4. **Enhancement Opportunities**
   - Batch/digest mode (daily summary emails)
   - Email template versioning
   - Bounce handling
   - Custom headers (X-Priority, X-Importance)
   - Attachment support
   - HTML sanitization
