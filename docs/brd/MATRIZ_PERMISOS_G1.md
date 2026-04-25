# Matriz de referencia G1 — permisos (PBAC) y trazas

**Propósito (lote 6 / `AUDITORIA_HUECOS_Y_ORDEN` §10):** mapeo legible de módulos → códigos de permiso en `app/core/permissions.py` y pruebas asociadas.

| Área | Códigos (prefijo) | Comprobación en repo |
|------|------------------|------------------------|
| Usuarios / admin | `users.*` | `test_admin.py`, `test_fase19_permissions.py` |
| Vulnerabilidades | `vulnerabilities.*` | `test_ownership`, smoke por ruta |
| Liberaciones / pipeline | `releases.*` | `test_fase19_permissions`, `test_etapa_release` |
| Iniciativas | `initiatives.*` | `test_bloque_b_m5_iniciativas` |
| Auditorías / temas / catálogos | `audits.*`, `emerging_themes.*`, `catalogs.*` | exports + permisos en tests |
| Notificaciones | `notifications.*` | `test_notificacion`, `procesar-reglas` backoffice |
| Tareas (framework) | `tasks.*` | `test_ownership` |
| Sistema (IA, health) | `system.*` | `test_fase21_system_health` |

**Roles** (`RolEnum` en el mismo módulo): `super_admin`, `chief_appsec`, `lider_programa`, `analista`, `auditor`, `readonly`, y roles base `admin` / `user`. La matriz rol × permiso **materializada** vive en tablas de rol/permiso; semillas: `fase19` / `test_fase19_permissions.py`.

**Mantenimiento:** al añadir un módulo expuesto, extender `P` y añadir prueba o contrato en `test_fase19_permissions` / `test_contract` según ADR-0001.
