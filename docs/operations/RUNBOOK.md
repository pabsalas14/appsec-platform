# Runbook operativo — despliegue y soporte (Fase H)

*Versión esqueleto: ampliar con URLs, contactos e incidentes reales de tu organización.*

## 1. Stack

| Componente | Rol |
|------------|-----|
| Nginx :80 | Proxy a `frontend` (Next) y `backend` (FastAPI) vía `/api` |
| PostgreSQL | Fuente de verdad; backups según política de infra |
| Contenedores | `make up` / `make down` (ver `README.md` y `docker-compose.yml`) |

## 2. Arranque y comprobación

1. `make up` o despliegue en orquestador.
2. Health: comprobar `GET /api/v1/health` (o ruta de salud expuesta) y tiempo de respuesta.
3. Frontend: carga de `/` (AuthGate) sin errores 5xx.
4. Logs: JSON estructurado (`event`, `request_id`); nunca almacenar secretos en `extra={}`.

## 3. Migraciones

- Tras cambios de modelo: `alembic upgrade head` en el contenedor backend (misma versión de imagen que el código en producción).
- Imagen backend **sin bind-mount** del código: reconstruir imagen al desplegar (`docker compose build backend`).

## 4. Incidencias habituales

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| 401 en toda la API | Cookies no enviadas; dominio / SameSite | Revisar `cookies.py` y Nginx `proxy_set_header` |
| 403 con CSRF | Falta `X-CSRF-Token` o cookie `csrf_token` | Cliente mutaciones con axios wrapper `@/lib/api` |
| 504 en `openapi` / carga lenta | Nginx / timeout | Aumentar timeouts de proxy; revisar `PERFORMANCE_OPTIMIZATION.md` |
| Contadores de dashboard incoherentes | Filtros de jerarquía vs. datos | Validar `subdireccion_id`… en query; revisar lógica D2 en `dashboard.py` |

## 5. Observabilidad

- Correlación por `X-Request-ID` entre API y (si aplica) logs de nginx.
- Auditoría: `/admin/audit-logs` (rol admin) o `GET /api/v1/audit-logs` con permisos.

## 6. Performance

- Revisar `docs/PERFORMANCE_OPTIMIZATION.md` para índices, paginación y conexión a BD.
- Objetivo interno: mantener pruebas de regresión verdes; subir `cov-fail-under` con cuidado (ver `Makefile` `test-cov`).

## 7. Cierre (Fase H)

- **Acta de aceptación:** plantilla en [`ACTA_ACEPTACION_PLANTILLA.md`](ACTA_ACEPTACION_PLANTILLA.md); enlazar a `MATRIZ_COBERTURA_BRD.md`.
- **G2 (notificaciones):** tarea programada o manual `POST /api/v1/notificacions/procesar-reglas` (backoffice) para reglas automáticas de SLA; documentar frecuencia.
- Añadir: responsables on-call, canales, ventanas de mantenimiento.
