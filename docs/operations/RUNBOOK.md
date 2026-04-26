# Runbook operativo — AppSec Platform

*Última revisión: 26 Abril 2026*

## 1. Stack

| Componente | Rol |
|------------|-----|
| Nginx :80/:443 | Proxy a `frontend` (Next.js) y `backend` (FastAPI) vía `/api` |
| PostgreSQL 16 | Fuente de verdad; backups según política de infra |
| FastAPI (backend) | API REST, autenticación por cookie httpOnly |
| Next.js 14 (frontend) | SSR + RSC; rutas bajo `/(dashboard)` |
| Contenedores | `make up` / `make down` (ver `docker-compose.yml`) |

---

## 2. Arranque y comprobación de salud

```bash
# Levantar servicios
make up

# Verificar estado
docker compose ps

# Health check API
curl -sf http://localhost:8000/api/v1/health

# Verificar frontend
curl -sf http://localhost:3000/ -o /dev/null && echo "Frontend OK"
```

**Señales de OK:**
- `GET /api/v1/health` → `{"status":"ok"}`
- Logs JSON estructurados (campo `event` presente, sin `500`)
- `docker compose ps` → todos los servicios en estado `Up`

---

## 3. Migraciones

```bash
# Aplicar migraciones pendientes (dentro del contenedor backend)
docker compose exec backend alembic upgrade head

# Verificar revisión activa
docker compose exec backend alembic current

# Rollback una revisión (solo en emergencia)
docker compose exec backend alembic downgrade -1
```

**Reglas:**
- Reconstruir imagen al desplegar: `docker compose build backend`
- No usar bind-mount del código en producción
- Nunca hacer `downgrade` sin validar integridad de datos primero

---

## 4. Incidencias habituales

### 4.1 Autenticación y sesión

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| `401` en toda la API | Cookie `session` no enviada o expirada | Verificar `SameSite`, `Secure` en `cookies.py`; revisar Nginx `proxy_set_header` |
| `403 CSRF` en mutaciones | Falta header `X-CSRF-Token` o cookie `csrf_token` | Confirmar que cliente usa `@/lib/api` (axios wrapper con CSRF automático) |
| Login falla con credenciales correctas | Cuenta deshabilitada | Admin → Usuarios → verificar campo `habilitado` |
| Sesión expira muy rápido | `SESSION_MAX_AGE` bajo | Revisar variable de entorno `SESSION_MAX_AGE` (default 8h) |

### 4.2 Vulnerabilidades

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| SLA no se calcula | `fecha_descubrimiento` nula | Verificar que el hallazgo tiene fecha válida; ejecutar `GET /api/v1/vulnerabilidad/{id}` y revisar campos |
| Estado bloqueado (no transiciona) | Regla de flujo de estatus activa | Admin → Flujos de Estatus → verificar reglas del módulo `vulnerabilidad` |
| Export CSV vacío | Filtros excluyen todos los registros | Revisar query params; probar sin filtros |

### 4.3 Temas Emergentes

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Tema sin movimiento >14 días | Sin actualizaciones de bitácora | Ver §10 de este runbook: Procedimiento Temas Emergentes |
| KPI "Sin Movimiento" incorrecto | `updated_at` no refleja actividad real | `GET /api/v1/dashboard/emerging-themes-summary` → revisar `recent_themes` vs datos en DB |
| No se puede agregar entrada bitácora | Error 403 | Verificar que el usuario tiene permiso `actualizacion_tema:create` |

### 4.4 Dashboards

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Contadores incoherentes | Filtros de jerarquía con `subdireccion_id` incorrecto | Revisar query params en `GET /api/v1/dashboard/*`; validar que el usuario tiene célula/subdirección asignada |
| Dashboard carga lento (>3s) | N+1 queries o índices faltantes | Ver `docs/PERFORMANCE_OPTIMIZATION.md`; revisar `EXPLAIN ANALYZE` en las queries del endpoint |
| `504` en endpoints de dashboard | Timeout Nginx | Aumentar `proxy_read_timeout` en nginx.conf; revisar `docs/PERFORMANCE_OPTIMIZATION.md` |
| Datos de D2-D9 vacíos | Usuario sin celula_id asignada | Admin → Usuarios → asignar célula al usuario |

### 4.5 Admin y configuración

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Regla IA no dispara | Proveedor IA mal configurado o sin API key | Admin → Integraciones → IA → verificar conexión y modelo activo |
| Notificaciones no se procesan | Tarea programada no ejecutada | Ver §9 de este runbook; ejecutar manualmente `POST /api/v1/notificacions/procesar-reglas` |
| Campo custom no aparece en módulo | Config de custom fields no publicada | Admin → Custom Fields → verificar que el campo está activo y asignado al módulo correcto |
| Catálogo vacío en select | Catálogo eliminado (soft delete) | Admin → Catálogos → verificar items activos (sin `deleted_at`) |

---

## 5. Observabilidad

### Correlación de logs

Cada request genera un `X-Request-ID` único. Para rastrear un error:

```bash
# Buscar todos los logs de una request específica
docker compose logs backend | grep "REQUEST_ID_AQUI"

# Ver últimos 100 errores del backend
docker compose logs backend --tail=500 | grep '"level":"error"'

# Logs de una ruta específica
docker compose logs backend | grep '"path":"/api/v1/tema-emergente"'
```

### Audit logs

- **UI**: `/admin/audit-logs` (requiere rol admin o super_admin)
- **API**: `GET /api/v1/audit-logs?action=tema_emergente.create&limit=50`
- Campos clave: `user_id`, `action`, `entity_id`, `entity_type`, `created_at`, `extra`

### Métricas clave a monitorear

| Métrica | Umbral normal | Alerta si |
|---------|--------------|-----------|
| Tiempo respuesta API (p95) | < 300ms | > 1000ms |
| Errores 5xx por minuto | 0 | > 3 |
| Conexiones PostgreSQL activas | < 20 | > 80 |
| Tiempo query dashboards | < 500ms | > 2000ms |

---

## 6. Performance

- Revisar `docs/PERFORMANCE_OPTIMIZATION.md` para índices, paginación y pool de conexiones.
- Los endpoints `/api/v1/dashboard/*` tienen mayor carga — son los primeros en escalar.
- Si hay lentitud en producción: verificar que los índices de `deleted_at`, `user_id`, `celula_id` existen con `\di` en psql.
- Paginación obligatoria: todos los listados usan `?skip=0&limit=50`; nunca pedir sin límite en producción.

---

## 7. On-Call

| Rol | Responsabilidad |
|-----|----------------|
| Responsable de turno | Primer respuesta (P0/P1 en < 15 min) |
| Lead AppSec | Escalación técnica |
| DBA | Incidentes de base de datos o migraciones |

**Canal de notificación:** *(completar con canal Slack/Teams del equipo)*

**Ventana de mantenimiento:**
- Preferente: domingos 02:00–04:00 hora local
- Notificar con 48h de anticipación en el canal de equipo
- Apagar notificaciones a usuarios antes de iniciar (`POST /api/v1/notificacions/procesar-reglas` en modo dry-run no existe aún — deshabilitar reglas desde Admin antes del mantenimiento)

**Escalación:**
1. Revisar este runbook (§4)
2. Revisar logs (§5)
3. Si no se resuelve en 30 min → escalar a Lead AppSec
4. Si es incidente de datos → involucrar DBA inmediatamente

---

## 8. SLAs operativos de incidencias

| Prioridad | Descripción | Tiempo de respuesta | Tiempo de resolución |
|-----------|-------------|--------------------|--------------------|
| **P0** | Sistema caído, login imposible, pérdida de datos | 15 min | 2 horas |
| **P1** | Módulo crítico inaccesible (vulnerabilidades, liberaciones) | 30 min | 4 horas |
| **P2** | Funcionalidad degradada (dashboards lentos, exportes fallando) | 2 horas | 1 día hábil |
| **P3** | Error cosmético o módulo secundario | 1 día hábil | 3 días hábiles |

---

## 9. Notificaciones programadas

El sistema de notificaciones automáticas requiere ejecución periódica del procesador de reglas:

```bash
# Ejecutar manualmente el procesador de reglas
curl -X POST http://localhost:8000/api/v1/notificacions/procesar-reglas \
  -H "Cookie: session=TU_SESSION_COOKIE" \
  -H "X-CSRF-Token: TU_CSRF_TOKEN"
```

**Frecuencia recomendada:** cada 6 horas (cron job o tarea programada en orquestador).

**Qué procesa:**
- Temas emergentes sin movimiento por más de X días (configurable en Admin → Reglas IA)
- Vulnerabilidades con SLA próximo a vencer
- Liberaciones bloqueadas sin actualización

**Verificación:**
```bash
# Ver notificaciones generadas recientemente
curl "http://localhost:8000/api/v1/notificacion?limit=20" \
  -H "Cookie: session=TU_SESSION_COOKIE"
```

---

## 10. Procedimiento: Temas Emergentes estancados

Ejecutar cuando un tema lleva más de 14 días sin actualización en bitácora:

1. **Identificar temas estancados:**
   ```bash
   curl "http://localhost:8000/api/v1/dashboard/emerging-themes-summary" \
     -H "Cookie: session=TU_SESSION_COOKIE"
   # Revisar campo "recent_themes" (temas sin movimiento en 7+ días)
   ```

2. **Ver detalle del tema:**
   ```bash
   curl "http://localhost:8000/api/v1/dashboard/tema/{TEMA_ID}/detail" \
     -H "Cookie: session=TU_SESSION_COOKIE"
   # Verificar "bitacora" — última entrada y fecha
   ```

3. **Acciones según impacto:**
   - **Alto impacto**: Notificar al responsable en 24h; si no hay respuesta en 48h → escalar a Chief AppSec
   - **Medio impacto**: Solicitar actualización en 72h
   - **Bajo impacto**: Marcar para revisión en siguiente reunión semanal

4. **Registrar la gestión** en la bitácora del tema desde la UI (Dashboard → Temas → Ver → Agregar actualización) o vía API:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/actualizacion-tema" \
     -H "Content-Type: application/json" \
     -H "Cookie: session=TU_SESSION_COOKIE" \
     -d '{"tema_id": "TEMA_ID", "titulo": "Seguimiento operativo", "contenido": "Revisión de seguimiento por operaciones. Pendiente respuesta del responsable.", "fuente": "Runbook §10"}'
   ```

5. **Si el tema debe cerrarse sin resolución:** registrar cierre con conclusión vía `POST /api/v1/cierre-conclusion` con `conclusion` y `recomendaciones`.

---

## 11. Cierre y acta de aceptación (Fase H)

- **Acta de aceptación:** plantilla en [`ACTA_ACEPTACION_PLANTILLA.md`](ACTA_ACEPTACION_PLANTILLA.md); enlazar a `MATRIZ_COBERTURA_BRD.md`.
- **G2 (notificaciones):** documentar frecuencia de `POST /api/v1/notificacions/procesar-reglas` en el orquestador de producción.
- Completar: responsables on-call nominales, canal de alertas, ventana de mantenimiento aprobada por el negocio.
