# Email Notifications Integration Guide (Section 18)

## Overview

This guide explains how to integrate the new email notification system with existing code.

## 1. Update Notification Rules (Recommended)

The notification rules engine already creates in-app notifications. We now add email support without breaking existing code.

### Current State (Before)

```python
# notification_rules_runner.py
async def run_notification_rules_sla_riesgo(db: AsyncSession):
    for v in rows:
        await notificacion_svc.create(
            db,
            NotificacionCreate(
                titulo=f"[SLA] Vulnerabilidad {v.id}: revisión antes de {v.fecha_limite_sla.date()}",
                cuerpo=f"Fuente {v.fuente}, severidad {v.severidad}.",
                leida=False,
            ),
            extra={"user_id": uid}
        )
```

### New State (After)

```python
# notification_rules_runner.py - UPDATED
from app.services.notification_dispatcher import notification_dispatcher

async def run_notification_rules_sla_riesgo(db: AsyncSession):
    for v in rows:
        # Use dispatcher instead of notificacion_svc.create()
        await notification_dispatcher.dispatch(
            db,
            user_id=uid,
            notification_type="sla_vencida",
            titulo=f"[SLA] Vulnerabilidad {v.id}: revisión antes de {v.fecha_limite_sla.date()}",
            cuerpo=f"Fuente {v.fuente}, severidad {v.severidad}.",
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

**Benefits:**
- Respects user preferences automatically
- Sends to both in-app and email (if enabled)
- Single point of configuration
- Backward compatible (dispatcher creates in-app internally)

## 2. Update Other Notification-Generating Code

Find all places that call `notificacion_svc.create()` and consider migrating to dispatcher.

### Example: Vulnerability Creation

```python
# vulnerabilidad_service.py - BEFORE
async def create_vulnerability(...):
    v = await super().create(db, create_in)
    
    # Notify responsable
    await notificacion_svc.create(
        db,
        NotificacionCreate(
            titulo=f"Nueva vulnerabilidad asignada: {v.titulo}",
            cuerpo=f"Severidad: {v.severidad}",
            leida=False,
        ),
        extra={"user_id": v.responsable_id}
    )
    return v
```

```python
# vulnerabilidad_service.py - AFTER
from app.services.notification_dispatcher import notification_dispatcher

async def create_vulnerability(...):
    v = await super().create(db, create_in)
    
    # Notify responsable with both channels
    await notification_dispatcher.dispatch(
        db,
        user_id=v.responsable_id,
        notification_type="vulnerabilidad_critica" if v.severidad == "Crítica" else "nueva_vulnerabilidad",
        titulo=f"Nueva vulnerabilidad asignada: {v.titulo}",
        cuerpo=f"Severidad: {v.severidad}",
        email_template_nombre="vulnerabilidad_critica" if v.severidad == "Crítica" else None,
        email_variables={
            "titulo": v.titulo,
            "severidad": v.severidad,
            "aplicacion": v.aplicacion or "Desconocida",
            "fuente": v.fuente or "Manual",
            "descripcion": v.descripcion[:100],
            "enlace_dashboard": f"https://appsec.local/vulnerabilidades/{v.id}"
        } if v.severidad == "Crítica" else None
    )
    return v
```

## 3. Add Email Preferences to User Onboarding

When a user is created or first logs in, prompt them to enable email notifications.

```python
# auth_service.py or user_service.py - AFTER FIRST LOGIN

from app.services.user_preferences_service import user_preferences_svc

async def on_user_first_login(db: AsyncSession, user_id: uuid.UUID):
    """Initialize default preferences for new user."""
    prefs = await user_preferences_svc.get_preferences(db, user_id)
    # Prefs already initialized with defaults
    # Optionally enable specific types for new users:
    # await user_preferences_svc.enable_email_channel(
    #     db, user_id,
    #     notification_types=["vulnerabilidad_critica"]
    # )
```

## 4. Register API Routes

Add email endpoints to your main FastAPI app.

```python
# main.py
from fastapi import FastAPI
from app.api.v1 import (
    email_template,
    user_preferences,
    # ... other routers
)

app = FastAPI()

# Register routes
app.include_router(email_template.router)
app.include_router(user_preferences.router)
```

## 5. Initialize Email System on Startup

```python
# main.py - in startup event

from contextlib import asynccontextmanager
from app.services.email_init import init_email_notifications

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with AsyncSession(engine) as db:
        await init_email_notifications(db)
        await db.commit()
    yield
    # Shutdown

app = FastAPI(lifespan=lifespan)
```

## 6. Create Admin Panel for Template Management

Optional: Add a UI page to manage email templates (admin only).

```typescript
// frontend/src/app/(dashboard)/admin/email-templates/page.tsx

"use client";

import { useEffect, useState } from "react";

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from /api/v1/email-templates
    fetch("/api/v1/email-templates", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTemplates(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Email Templates</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Asunto</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <td>{t.nombre}</td>
                <td>{t.asunto}</td>
                <td>{t.activo ? "✓" : "✗"}</td>
                <td>
                  <button>Edit</button>
                  <button>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

## 7. Add Email Preferences UI

Show email preferences in user settings.

```typescript
// frontend/src/app/(dashboard)/settings/preferences/page.tsx

"use client";

import { useEffect, useState } from "react";

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user preferences
    fetch("/api/v1/user-preferences", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPreferences(data))
      .finally(() => setLoading(false));
  }, []);

  const handleEnableEmail = async (types) => {
    const res = await fetch("/api/v1/user-preferences/email/enable", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ notification_types: types }),
    });
    const updated = await res.json();
    setPreferences(updated);
  };

  return (
    <div>
      <h1>Notificación Preferences</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form>
          <label>
            <input
              type="checkbox"
              checked={preferences?.notificaciones_automaticas}
            />
            Habilitar Notificaciones Automáticas
          </label>

          <fieldset>
            <legend>Email Notifications</legend>
            {Object.entries(preferences?.email_notificaciones || {}).map(
              ([type, enabled]) =>
                type !== "_global" && (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) =>
                        handleEnableEmail(
                          e.target.checked ? [type] : []
                        )
                      }
                    />
                    {type.replace(/_/g, " ")}
                  </label>
                )
            )}
          </fieldset>

          <label>
            Digest Type:
            <select
              value={preferences?.digest_type}
              onChange={(e) =>
                handleUpdatePreferences({
                  digest_type: e.target.value,
                })
              }
            >
              <option value="immediato">Inmediato</option>
              <option value="diario">Diario</option>
            </select>
          </label>

          <button type="submit">Guardar Preferencias</button>
        </form>
      )}
    </div>
  );
}
```

## 8. Error Handling & Monitoring

### Log Email Errors

```python
# In error handlers or middleware
from app.core.logging import logger

# Errors are already logged by email_service
# Check logs for:
# - "email_service.smtp_connection_failed"
# - "email_service.send_failed_queued_retry"
# - "email_service.retry_failed"
```

### Monitor Email Metrics

```sql
-- Dashboard queries
SELECT 
  estado,
  COUNT(*) as total,
  ROUND(100 * COUNT(*)::numeric / (SELECT COUNT(*) FROM email_logs), 1) as percentage
FROM email_logs
GROUP BY estado;

-- Delivery rate (last 24h)
SELECT 
  100 * COUNT(CASE WHEN estado='enviado' THEN 1 END)::numeric / COUNT(*) as delivery_rate
FROM email_logs
WHERE created_at > now() - interval '24 hours';

-- Most common errors
SELECT error_mensaje, COUNT(*) 
FROM email_logs 
WHERE estado='fallido'
GROUP BY error_mensaje
ORDER BY COUNT(*) DESC
LIMIT 5;
```

## 9. Testing Integration

```python
# tests/test_email_integration.py

import pytest
from app.services.notification_dispatcher import notification_dispatcher

@pytest.mark.asyncio
async def test_full_notification_flow(db: AsyncSession, user: User):
    """Test in-app + email notification dispatch."""
    # Enable email for user
    from app.services.user_preferences_service import user_preferences_svc
    await user_preferences_svc.enable_email_channel(
        db, user.id,
        notification_types=["sla_vencida"]
    )
    
    # Dispatch notification
    result = await notification_dispatcher.dispatch(
        db,
        user_id=user.id,
        notification_type="sla_vencida",
        titulo="Test SLA",
        cuerpo="Test body",
        email_template_nombre="sla_vencida",
        email_variables={
            "vulnerabilidad_id": "TEST-001",
            # ... other vars
        }
    )
    
    # Assert both channels
    assert "in_app" in result["channels_sent"]
    assert "email" in result["channels_sent"]
    assert result["in_app"] is not None
    assert result["email"] is not None
```

## 10. Migration Checklist

- [ ] Add environment variables to `.env`
- [ ] Run database migration: `alembic upgrade head`
- [ ] Register API routes in main.py
- [ ] Add email_init to startup
- [ ] Update notification_rules_runner.py
- [ ] (Optional) Update other notification sources
- [ ] Test SMTP connection
- [ ] Test email sending (API or direct call)
- [ ] Enable async worker (APScheduler/Celery)
- [ ] Add user preferences UI
- [ ] (Optional) Add template management UI
- [ ] Deploy to staging
- [ ] Test with real SMTP
- [ ] Deploy to production
- [ ] Monitor email metrics

## Common Patterns

### Pattern 1: Critical Alerts

```python
# Always send email for critical notifications
await notification_dispatcher.dispatch(
    db,
    user_id=user_id,
    notification_type="vulnerabilidad_critica",
    titulo="CRÍTICO: Nueva vulnerabilidad",
    cuerpo="Se requiere acción inmediata",
    email_template_nombre="vulnerabilidad_critica",
    # ... variables
)
```

### Pattern 2: Regular Updates

```python
# Respect user preferences
await notification_dispatcher.dispatch(
    db,
    user_id=user_id,
    notification_type="tema_emergente_actualizado",
    titulo="Tema actualizado",
    cuerpo="Revise los cambios",
    email_template_nombre="tema_emergente_actualizado",
    # ... variables
)
# User can opt-out via preferences
```

### Pattern 3: Batch Notifications

```python
# For future digest mode
result = await notification_dispatcher.dispatch(
    db,
    user_id=user_id,
    notification_type="sla_vencida",
    titulo="SLA aviso",
    cuerpo="...",
    email_template_nombre="sla_vencida",
    # ... variables
    # digest_mode=True  # Not yet implemented
)
```

## Support & Debugging

For issues, check:

1. **Email Configuration**
   - `EMAIL_ENABLED=true` in .env
   - SMTP credentials valid
   - Test SMTP connection manually

2. **User Preferences**
   - GET `/api/v1/user-preferences`
   - Check `email_notificaciones` settings

3. **Email Logs**
   - Query `email_logs` table
   - Check error_mensaje for SMTP errors
   - Verify estado transitions

4. **Application Logs**
   - Search for `email_service` entries
   - Check for exceptions in startup

5. **Database**
   - Verify tables exist: `\dt email_*`
   - Check templates: `SELECT * FROM email_templates;`

Contact the platform team if issues persist.
