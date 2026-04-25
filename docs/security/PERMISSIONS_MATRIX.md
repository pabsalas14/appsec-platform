# Matriz de permisos (G1) — referencia

**Fuente de verdad en código:** `app/core/permissions.py` (objeto `P`) y comprobación en tests `tests/test_fase19_permissions.py` y rutas vía `require_permission` / `require_role` / `require_backoffice`.

| Ámbito | Códigos (extracto) | Uso |
|--------|----------------------|-----|
| Notificaciones | `P.NOTIFICATIONS.VIEW` / `EDIT` | `GET/POST/PATCH/DELETE` `/notificacions` (excepto `procesar-reglas`) |
| Vulnerabilidades | `P.VULNERABILITIES.*` | Export, mutaciones, triaje |
| Iniciativas | `P.INITIATIVES.*` | Exports, etc. |
| **Back office** | Rol `admin` o `super_admin` | `require_backoffice` — p. ej. `POST /notificacions/procesar-reglas`, ajustes admin |

*Añadir filas con cada módulo nuevo. Actualizar con cada cambio de permiso o rol.*
