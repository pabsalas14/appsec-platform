# AppSec Platform

> **Plataforma centralizada de Application Security** — un sistema único donde el equipo de AppSec tiene visibilidad completa del estado de vulnerabilidades, programas, auditorías e iniciativas sin depender de reportes manuales ni hojas de cálculo.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Tests](https://img.shields.io/badge/suite%20backend-%7E391%20tests-brightgreen)](#pruebas)
[![OWASP](https://img.shields.io/badge/OWASP-API%20Top%2010-red)](https://owasp.org/API-Security/)

---

## ¿Qué es esta plataforma?

La **AppSec Platform** centraliza en un solo sistema la gestión completa de seguridad de aplicaciones:

- Vulnerabilidades detectadas por SAST, DAST, SCA, Threat Modeling, MAST, auditorías externas y revisiones de terceros
- Programas de seguridad con seguimiento mensual de actividades
- Flujos de aprobación con **Segregación de Funciones (SoD)** configurable
- Indicadores de madurez de seguridad y dashboards ejecutivos
- Integraciones con IA planificadas para asistencia en Threat Modeling y triaje de hallazgos

Todo con trazabilidad **100% auditable**: cada acción, cambio de configuración, exportación y aprobación queda registrada de forma inmutable.

---

## Arquitectura General

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Navegador)                        │
└──────────────────────────────┬───────────────────────────────────┘
                               │ :80 / :443
                    ┌──────────▼──────────┐
                    │        Nginx         │
                    │   Reverse Proxy      │
                    │   Security Headers   │
                    │   CORS + Rate Limit  │
                    └─────┬───────────┬───┘
                          │           │
               /api/*     │           │  /*
      ┌─────────▼────────┐│           │┌──────────────────────┐
      │     Backend       ││           ││      Frontend         │
      │  FastAPI :8000    ││           ││    Next.js :3000      │
      │  Python 3.12      ││           ││    TypeScript         │
      │  SQLAlchemy 2.0   ││           ││    Tailwind CSS       │
      │  Pydantic v2      ││           ││    Shadcn UI          │
      │  Alembic          ││           ││    TanStack Query     │
      └─────────┬─────────┘│           │└──────────────────────┘
                │           │           │
      ┌─────────▼───────────┴───────────┘
      │         PostgreSQL 16                │
      │         (almacenamiento principal)   │
      └──────────────────────────────────────┘

      ┌────────────────────────────────────┐
      │       Proveedor de IA (configurable) │
      │  Ollama (local, por defecto)         │
      │  Claude / GPT / OpenRouter (pago)    │
      └────────────────────────────────────┘
```

### Tecnologías

| Capa | Tecnología | Rol |
|------|-----------|-----|
| **Proxy** | Nginx Alpine | Proxy inverso, cabeceras de seguridad, CORS |
| **Backend** | FastAPI + Uvicorn | API REST async, 100% tipado |
| **ORM** | SQLAlchemy 2.0 async | Acceso a BD, relaciones, soft delete |
| **Validación** | Pydantic v2 | Esquemas de entrada/salida, validadores |
| **Migraciones** | Alembic | Control de versiones del esquema de BD |
| **Base de datos** | PostgreSQL 16 | Almacenamiento principal con UUID nativo |
| **Frontend** | Next.js 14 (App Router) | React SSR/CSR, enrutamiento por archivos |
| **UI** | Tailwind CSS + Shadcn UI | Componentes accesibles, modo oscuro |
| **Estado** | TanStack Query + Zustand | Caché de servidor + estado local |
| **Formularios** | React Hook Form + Zod | Validación en cliente (defensa en profundidad) |
| **Pruebas** | Pytest + Httpx async | Suite completa de integración |
| **Orquestación** | Docker Compose | Stack completo con un solo comando |

---

## Módulos del Sistema

La plataforma se organiza en **13 módulos de negocio** más **4 módulos transversales**.

---

### Módulo 1 — Catálogos Centrales ✅

Jerarquía alineada al **BRD** (documento de requerimientos en la raíz del repo): cadena organizacional y activos. Toda vulnerabilidad y hallazgo hereda contexto desde el inventario.

```
Subdirección
    └── Gerencia
            └── Organización (GitHub / Atlassian — plataforma, URL, responsable)
                    └── Célula
                            ├── Repositorio      (código fuente → SAST / SCA)
                            ├── ActivoWeb        (aplicaciones web → DAST)
                            ├── Servicio         (APIs y microservicios)
                            └── AplicacionMovil  (apps móviles → MAST)
```

**Migración Alembic** `f3a9c1d2e8b0`: la organización de plataforma cuelga de la gerencia; la célula referencia solo `organizacion_id` (la cadena completa se obtiene por joins). Campos opcionales en subdirección: director / contacto.

Entidades adicionales: `TipoPrueba` (SAST / DAST / SCA / TM / MAST) y `ControlSeguridad`.

---

### Módulo 2 — Panel de Administración ✅

13 elementos de configuración operativa, todos editables desde el panel sin tocar código:

| # | Elemento configurable |
|---|-----------------------|
| 1 | Tipos de programas anuales |
| 2 | Flujos de estado de vulnerabilidades por tipo |
| 3 | Tipos de iniciativas (personalizables) |
| 4 | Severidades + SLA en días (Crítica 7d · Alta 30d · Media 60d · Baja 90d) |
| 5 | Tipos de auditorías (Interna / Externa) |
| 6 | Regulaciones y marcos normativos |
| 7 | Tecnologías del stack |
| 8 | Pesos de scoring por categoría |
| 9 | Tipos de temas emergentes |
| 10 | SLAs por motor y severidad |
| 11 | Roles y permisos granulares (hasta nivel de widget) |
| 12 | Plantillas de notificaciones internas |
| 13 | Umbrales de semáforos (rojo / amarillo / verde) |

Cada cambio genera una entrada de auditoría con diff completo (valor anterior → valor nuevo).

**Segregación de Funciones (SoD):** configurable por acción crítica vía `ReglaSoD`. Si la regla está activa, el sistema rechaza automáticamente que la misma persona inicie y apruebe una acción sensible.

---

### Módulo 3 — Programas de Seguridad ⬜

Cinco programas con entidades propias que generan hallazgos trazables:

| Programa | Activo afectado | Genera |
|---------|----------------|--------|
| **Análisis Estático (SAST/SCA)** | Repositorios | Hallazgos → Vulnerabilidad |
| **Análisis Dinámico (DAST)** | Activos Web | Hallazgos → Vulnerabilidad |
| **Modelado de Amenazas** | Servicios / Activos | Amenazas STRIDE + scoring DREAD |
| **Seguridad de Código Fuente** | Repositorios | Controles: branch protection, secret scanning |
| **Servicios bajo regulación** | Servicios | Cumplimiento por ciclo (trimestral / anual) |

---

### Módulo 4 — MAST (Seguridad Móvil) ⬜

Ejecuciones de análisis sobre aplicaciones móviles con hallazgos que alimentan el ciclo de vulnerabilidades.

---

### Módulo 5 — Iniciativas ⬜

Seguimiento de iniciativas de mejora: `Iniciativa → HitoIniciativa → ActualizacionIniciativa`. Tipos configurables desde el panel de administración.

---

### Módulo 6 — Auditorías ⬜

`Auditoria → HallazgoAuditoria → EvidenciaAuditoria (SHA-256) → PlanRemediacion`.

Las evidencias almacenan hash SHA-256 para verificación de integridad (regla A3).

---

### Módulo 7 — Temas Emergentes ⬜

Seguimiento de temas de seguridad emergentes: `TemaEmergente → ActualizacionTema → CierreConclusion`.

---

### Módulo 8 — Operación (Releases) ⬜

#### Service Releases

Estados secuenciales obligatorios: `Revisión de Diseño → Validación de Seguridad → Pruebas de Seguridad → Aprobación → QA → Producción`

- Solo avanza si la etapa anterior está aprobada
- Justificación obligatoria al saltarse estados
- SoD en aprobación: quien crea el release no puede aprobarlo

#### Pipeline Releases

SAST / DAST explícito en cada release. Si falla, genera vulnerabilidades automáticamente.

#### Revisiones de Terceros

Revisiones externas con hallazgos trazables al ciclo de vida de vulnerabilidades.

---

### Módulo 9 — Gestión de Vulnerabilidades ✅

**Ciclo de vida unificado** para todos los hallazgos independientemente de la fuente.

```
  SAST · DAST · SCA · TM · MAST · Auditoría · Tercero
                         │
                ┌────────▼─────────┐
                │  Vulnerabilidad   │
                │                  │
                │  severidad        │──→ SLA calculado automáticamente
                │  fuente           │
                │  estado           │──→ flujo configurable desde admin
                │  activo afectado  │──→ repositorio | activo web |
                │                  │    servicio | app móvil
                └────────┬─────────┘
                         │
       ┌─────────────────┼──────────────────┐
       │                 │                  │
┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────────┐
│  Historial  │  │  Excepción   │  │   Aceptación de  │
│ (inmutable) │  │  (temporal)  │  │      Riesgo      │
│             │  │              │  │                  │
│  cada cambio│  │  SoD (A6)   │  │  SoD (A6)        │
│  de estado  │  │  justif.≥10c │  │  justif. negocio │
│  queda      │  │  aprobador   │  │  propietario     │
│  registrado │  │  ≠ creador  │  │  fecha revisión  │
└─────────────┘  └─────────────┘  └──────────────────┘
                                           │
                              ┌────────────┘
                    ┌─────────▼──────────┐
                    │      Evidencia     │
                    │   de Remediación   │
                    │   SHA-256 (A3)     │
                    └────────────────────┘
```

**Endpoints principales:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/vulnerabilidads` | Lista por usuario |
| `GET` | `/api/v1/vulnerabilidads/export.csv` | Export CSV (permiso `vulnerabilities.export`; auditoría A7) |
| `POST` | `/api/v1/vulnerabilidads` | Crear vulnerabilidad |
| `PATCH` | `/api/v1/vulnerabilidads/{id}` | Actualizar parcialmente |
| `DELETE` | `/api/v1/vulnerabilidads/{id}` | Soft-delete (A2) |
| `GET` | `/api/v1/historial_vulnerabilidads` | Historial (filtrable por vulnerabilidad) |
| `POST` | `/api/v1/excepcion_vulnerabilidads/{id}/aprobar` | Aprobar excepción con SoD |
| `POST` | `/api/v1/excepcion_vulnerabilidads/{id}/rechazar` | Rechazar excepción con SoD |
| `POST` | `/api/v1/aceptacion_riesgos/{id}/aprobar` | Aprobar riesgo con SoD |
| `POST` | `/api/v1/aceptacion_riesgos/{id}/rechazar` | Rechazar riesgo con SoD |

---

### Módulo 10 — Indicadores y Métricas ⬜

- **Indicadores por motor** calculados automáticamente desde datos de programas
- **Índice de Madurez de Seguridad** por célula, subdirección y organización; pesos configurables; histórico mensual
- **Indicador de cumplimiento regulatorio** trimestral, ponderado por OWASP, semáforo con umbrales configurables
- **Seguimiento de SLA** — cumplimiento por severidad, MTTR, tendencias

---

### Módulo 11 — Dashboards (9 vistas) 🟨 (implementación en progreso)

Estado actual: 9 vistas publicadas, drill-down jerárquico operativo en paneles ejecutivo/vulnerabilidades/equipo/releases/programas/detalle de programa, y visibilidad por widget configurable por rol en home y dashboards dedicados. Pendiente: filtros guardados end-to-end y drill-down funcional en iniciativas/temas emergentes.

| # | Vista | Descripción |
|---|-------|-------------|
| 1 | **Ejecutivo** | KPIs globales, semáforos, tendencias |
| 2 | **Equipo** | Estado por analista y célula |
| 3 | **Programas Consolidado** | Avance de todos los programas |
| 4 | **Detalle de Programa** | Zoom a un programa específico |
| 5 | **Vulnerabilidades Multi-Dimensión** | Pivote por fuente, severidad, estado, SLA |
| 6 | **Releases (Tabla)** | Historial de releases con filtros avanzados |
| 7 | **Releases (Tablero)** | Vista de tablero de releases por estado |
| 8 | **Iniciativas** | Avance por hito e iniciativa |
| 9 | **Temas Emergentes** | Estado y tendencia de temas activos |

---

### Módulo 12 — Seguridad, Roles y Notificaciones ⬜ (parcialmente implementado)

**6 roles base** (editables y configurables desde el panel):

| Rol | Capacidades |
|-----|-------------|
| `super_admin` | Todo: configuración, usuarios, roles, salud del sistema |
| `chief_appsec` | Lectura total + aprobaciones + dashboard ejecutivo |
| `lider_programa` | Gestión completa de programas asignados |
| `analista` | Operación diaria: triaje, actividades, releases |
| `auditor` | Lectura total incluye audit logs, sin modificar |
| `readonly` | Solo dashboards ejecutivos |

**Notificaciones internas pendientes:**
- SLA próximo a vencer
- Nueva vulnerabilidad crítica asignada
- Release pendiente de aprobación
- Cambio de estado en un ítem asignado
- Reporte mensual de madurez disponible

---

### Módulo 13 — Integración IA (multi-proveedor) ⬜

Abstracción `AIProvider` con implementaciones intercambiables, seleccionable desde el panel de administración:

| Proveedor | Tipo | Uso recomendado |
|-----------|------|-----------------|
| **Ollama** | Local (por defecto) | Desarrollo, datos sensibles que no deben salir |
| Claude (Anthropic) | Pago | Producción, alta calidad de análisis |
| GPT (OpenAI) | Pago | Alternativa de pago |
| OpenRouter | Pago (proxy) | Flexibilidad de modelo |

**Casos de uso:**
- **Threat Modeling asistido** — genera amenazas con categoría STRIDE + scoring DREAD + controles sugeridos al crear una sesión
- **Triaje de falsos positivos** — clasifica hallazgos SAST/DAST/SCA en: Probable FP / Requiere Revisión / Vulnerabilidad Confirmada

---

### Módulos Transversales

| Módulo | Descripción |
|--------|-------------|
| **T1 — Cumplimiento y Auditoría** ⬜ | Buscador de eventos, timeline por entidad, verificación de integridad del chain de auditoría, exportación del log |
| **T2 — Filtros Guardados** ⬜ | Filtros personales y compartidos en todos los dashboards y tablas |
| **T3 — Changelog de la Plataforma** ⬜ | Registro de versiones, novedades y correcciones visible para usuarios |
| **T4 — Salud del Sistema** ⬜ | Estado de importaciones, jobs, espacio en BD, sesiones activas, estado del proveedor de IA |

---

## Reglas de Auditabilidad

8 reglas de auditabilidad implementadas en toda la plataforma:

| Regla | Descripción | Implementación |
|-------|-------------|----------------|
| **A1** | Justificación obligatoria en acciones críticas | `min_length=10` en esquemas de aprobación, excepción y cierre |
| **A2** | Soft delete universal | `SoftDeleteMixin` con `deleted_at` + `deleted_by` en todas las entidades |
| **A3** | Integridad de evidencias | SHA-256 almacenado en `EvidenciaRemediacion` y `Attachment` |
| **A4** | Registro de auditoría a prueba de manipulación | Cadena de hashes SHA-256: cada registro guarda `prev_hash` y `row_hash` |
| **A5** | Auditoría de cambios de configuración | Diff completo en cada modificación de `SystemSetting` |
| **A6** | Segregación de Funciones configurable | `ReglaSoD` por acción; servicios validan `aprobador_id ≠ creador_id` |
| **A7** | Auditoría de exportaciones | Usuario, fecha, filtros aplicados, cantidad de registros, hash del archivo |
| **A8** | Vista dedicada de auditoría | Accesible para roles `auditor`, `chief_appsec`, `super_admin` |

---

## Seguridad OWASP

### API Security Top 10 (2023)

| Control | Implementación |
|---------|----------------|
| **API1 — BOLA/IDOR** | `require_ownership()` en todos los endpoints con entidades de dueño; pruebas IDOR por entidad |
| **API2 — Autenticación** | HttpOnly cookies, CSRF double-submit, rotación de tokens, revocación por familia de sesión |
| **API3 — Exposición de propiedades** | Esquemas Pydantic con campos explícitos; nunca `model_dump()` crudo en respuestas |
| **API4 — Consumo de recursos** | Paginación obligatoria (máx 100), rate limiting, límite de upload 10 MB, tope de operaciones masivas 500 |
| **API5 — Autorización a nivel de función** | `require_role()` en endpoints de administración; matriz de permisos validada en pruebas |
| **API6 — Abuso de flujos de negocio** | SoD bloquea flujos de aprobación; rate limit en importaciones, exportaciones y llamadas a IA |
| **API7 — SSRF** | Validador SSRF-safe: bloquea IPs privadas, loopback y de metadatos en campos de URL |
| **API8 — Configuración insegura** | Cabeceras de seguridad en Nginx y middleware: HSTS, X-Frame-Options, CSP, X-Content-Type-Options |
| **API9 — Inventario** | Versionado `/api/v1/...`, especificación OpenAPI siempre actualizada |
| **API10 — Consumo inseguro de APIs** | Timeout + retry + validación Pydantic de la respuesta en toda llamada al proveedor de IA |

---

## Inicio Rápido

### Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) y Docker Compose v2+
- Git y GNU Make

### 1. Clonar y configurar

```bash
git clone <url-del-repositorio> appsec-platform
cd appsec-platform

cp .env.example .env
```

Editar `.env` con los valores requeridos:

```dotenv
# Generar con: python -c "import secrets; print(secrets.token_urlsafe(64))"
SECRET_KEY=clave-secreta-aqui

# Cuenta de administrador inicial (usada por el seed)
ADMIN_EMAIL=admin@empresa.com
ADMIN_PASSWORD=PasswordSeguro123!

# IA — local por defecto (Ollama)
AI_DEFAULT_PROVIDER=ollama
OLLAMA_URL=http://host.docker.internal:11434
AI_MODEL=llama3.1:8b

# Opcional — proveedor de pago
# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...
```

### 2. Levantar el stack

```bash
make up
```

Este comando construye todas las imágenes Docker, levanta PostgreSQL, Backend, Frontend y Nginx, y ejecuta las migraciones de Alembic automáticamente.

### 3. Poblar datos iniciales

```bash
make seed
```

Crea de forma idempotente (seguro de ejecutar múltiples veces):
- Usuario `admin` con el password del `.env`
- 32 configuraciones del sistema (`SystemSetting`)
- 5 reglas de SoD preconfiguradas
- 5 tipos de prueba base (SAST, DAST, SCA, TM, MAST)
- 12 controles de seguridad base
- 5 herramientas externas de ejemplo

### 4. Acceder

| Servicio | URL |
|---------|-----|
| **Aplicación** | http://localhost |
| **Documentación API (Swagger)** | http://localhost/docs |
| **ReDoc** | http://localhost/redoc |
| **Health Check** | http://localhost/api/health |

---

## Estructura del Proyecto

```
appsec-platform/
├── .env.example
├── docker-compose.yml
├── Makefile
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/               # 16 migraciones
│   └── app/
│       ├── main.py                 # Punto de entrada ASGI + middlewares
│       ├── config.py               # Configuración vía variables de entorno
│       ├── database.py             # Sesión async + Base ORM
│       ├── seed.py                 # Datos iniciales idempotentes
│       │
│       ├── core/
│       │   ├── security.py         # JWT, bcrypt, CSRF
│       │   ├── exceptions.py       # Wrappers de HTTPException
│       │   ├── response.py         # Envelopes: success / paginated / error
│       │   ├── validators.py       # Validador SSRF-safe para URLs
│       │   └── encryption.py       # AES-256 para datos sensibles
│       │
│       ├── models/
│       │   ├── mixins.py           # SoftDeleteMixin (A2)
│       │   ├── audit_log.py        # Cadena de hashes (A4)
│       │   ├── attachment.py       # SHA-256 en archivos (A3)
│       │   ├── system_setting.py   # 32 configuraciones operativas
│       │   ├── regla_so_d.py       # SoD configurable (A6)
│       │   ├── # Catálogos (M1)
│       │   ├── subdireccion.py · celula.py · repositorio.py
│       │   ├── activo_web.py · servicio.py · aplicacion_movil.py
│       │   ├── tipo_prueba.py · control_seguridad.py
│       │   └── # Vulnerabilidades (M9)
│       │       ├── vulnerabilidad.py
│       │       ├── historial_vulnerabilidad.py
│       │       ├── excepcion_vulnerabilidad.py
│       │       ├── aceptacion_riesgo.py
│       │       └── evidencia_remediacion.py
│       │
│       ├── schemas/                # Pydantic v2
│       ├── services/               # BaseService + extensiones con SoD
│       └── api/v1/
│           ├── router.py
│           ├── admin/              # Usuarios, roles, configuración, SoD, herramientas
│           ├── # Catálogos (M1)
│           └── # Vulnerabilidades (M9) + endpoints /aprobar y /rechazar
│
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── app/(dashboard)/        # Rutas protegidas por rol
│       ├── components/ui/          # Componentes Shadcn
│       ├── hooks/                  # TanStack Query por entidad
│       ├── lib/schemas/            # Validadores Zod
│       └── types/                  # Interfaces TypeScript
│
└── nginx/
    └── nginx.conf                  # Proxy + CORS + cabeceras de seguridad
```

---

## Contrato de API

Todas las respuestas siguen el envelope estándar:

### Respuesta exitosa

```json
{
  "status": "success",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "titulo": "Inyección SQL en endpoint de autenticación",
    "severidad": "Critica",
    "estado": "Abierta",
    "fuente": "SAST"
  },
  "meta": {
    "timestamp": "2026-04-22T23:00:00Z",
    "request_id": "abc-123",
    "version": "v1"
  }
}
```

### Lista paginada

```json
{
  "status": "success",
  "data": [ ... ],
  "pagination": {
    "total": 247,
    "skip": 0,
    "limit": 50,
    "hasMore": true
  }
}
```

### Error de validación

```json
{
  "status": "error",
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "severidad"],
      "msg": "severidad debe ser uno de: Alta, Baja, Critica, Media",
      "input": "Extreme"
    }
  ],
  "code": "RequestValidationError"
}
```

---

## Flujo de Autenticación

```
Navegador                Nginx               Backend
    │                      │                    │
    │  POST /api/v1/auth/login                  │
    ├─────────────────────►│───────────────────►│
    │                      │                    │ Verifica credenciales
    │                      │                    │ Genera access + refresh tokens
    │                      │◄───────────────────┤
    │◄─────────────────────┤ Set-Cookie:        │
    │  (HttpOnly)          │ access_token       │
    │  (HttpOnly)          │ refresh_token      │
    │  (legible)           │ csrf_token         │
    │                      │                    │
    │  GET /api/v1/...     │                    │
    │  + X-CSRF-Token      │                    │
    ├─────────────────────►│───────────────────►│ Valida JWT + CSRF
    │                      │                    │ Verifica propiedad
    │◄─────────────────────┤◄───────────────────┤ Filtra soft-deleted
    │  200 + data          │                    │
```

- **HttpOnly cookies** — inaccesibles desde JavaScript (previene XSS)
- **CSRF double-submit** — `csrf_token` cookie legible + header `X-CSRF-Token` en mutaciones
- **Rotación de refresh token** — cada uso genera uno nuevo; el anterior se revoca
- **Revocación por familia** — si se detecta reutilización de un token revocado, se invalida toda la sesión

---

## Comandos de Desarrollo

### Ciclo de vida

| Comando | Descripción |
|---------|-------------|
| `make up` | Construir e iniciar todos los servicios |
| `make down` | Detener y eliminar contenedores |
| `make restart` | Reinicio rápido |
| `make build` | Reconstruir imágenes sin iniciar |
| `make seed` | Re-ejecutar semilla de datos (idempotente) |
| `make clean` | ⚠️ Detener y eliminar **todos** los volúmenes |

### Depuración

| Comando | Descripción |
|---------|-------------|
| `make logs` | Ver logs de todos los servicios |
| `make logs-back` | Logs del backend |
| `make logs-front` | Logs del frontend |
| `make shell-back` | Bash en el contenedor backend |
| `make shell-db` | PSQL en el contenedor PostgreSQL |
| `make status` | Estado de contenedores y rama activa |

### Pruebas

```bash
# Ejecutar toda la suite
make test

# Pruebas específicas
docker compose exec backend pytest tests/test_vulnerabilidad.py -v

# Con reporte de fallas detallado
docker compose exec backend pytest tests/ -v --tb=short
```

**~391 pruebas de integración** (`make test` sobre la base de datos de pruebas) — incluyendo:
- Contrato API (envelopes, rutas protegidas) y autenticación cookie + CSRF
- Smoke + IDOR por entidad con dueño (`require_ownership`)
- Bloques B/C (flujos de estatus, indicadores, filtros guardados, dashboards)
- Permisos granulares (`require_permission`): p. ej. `dashboards.view`, `vulnerabilities.export`
- Validación de negocio (422 en esquemas de vulnerabilidad y catálogos)

### Agregar nuevas entidades

```bash
# Genera modelo + esquema + servicio + router + hook frontend + prueba
make new-entity NAME=NombreEntidad FIELDS="campo1:str,campo2:int?,campo3:uuid"

# Generar y aplicar migración
make shell-back
alembic revision --autogenerate -m "Agregar NombreEntidad"
alembic upgrade head

# Regenerar tipos TypeScript
make types
```

> ⚠️ **Nunca crear entidades a mano** — siempre usar `make new-entity` para garantizar consistencia con los patrones del framework.

---

## Variables de Entorno

| Variable | Req | Por defecto | Descripción |
|----------|:---:|------------|-------------|
| `SECRET_KEY` | ✅ | — | Clave de firma JWT |
| `ADMIN_EMAIL` | ✅ | — | Email del admin inicial |
| `ADMIN_PASSWORD` | ✅ | — | Contraseña del admin inicial |
| `POSTGRES_USER` | | `framework` | Usuario de BD |
| `POSTGRES_PASSWORD` | | `framework_secret` | Contraseña de BD |
| `POSTGRES_DB` | | `framework` | Nombre de BD |
| `JWT_ACCESS_EXPIRE_MINUTES` | | `30` | TTL del token de acceso |
| `JWT_REFRESH_EXPIRE_DAYS` | | `7` | TTL del token de refresco |
| `CORS_ORIGINS` | | localhost | Orígenes permitidos |
| `MAX_UPLOAD_SIZE_MB` | | `10` | Límite de carga de archivos |
| `AI_DEFAULT_PROVIDER` | | `ollama` | Proveedor de IA activo |
| `OLLAMA_URL` | | `http://host.docker.internal:11434` | URL de Ollama local |
| `AI_MODEL` | | `llama3.1:8b` | Modelo de IA a utilizar |
| `ANTHROPIC_API_KEY` | | — | Clave de API Anthropic |
| `OPENAI_API_KEY` | | — | Clave de API OpenAI |
| `OPENROUTER_API_KEY` | | — | Clave de API OpenRouter |
| `ENABLE_OPENAPI_DOCS` | | `true` | Habilitar Swagger UI |

---

## Roadmap de Funcionalidades

### Estado Actual — Bloque C en ejecución (Fases 17-19)

**Completado (Fases 0-18):**
- [x] Fase 0-9: Inicialización, Catálogos, Admin, Auditabilidad Base, Roles, Vulnerabilidades, Releases, Programas, MAST, Motor de Scoring
- [x] Fase 10: Jerarquía Organizacional (Organizacion + Gerencia + FKs)
- [x] Fase 11: SystemSetting ampliado (50+ keys: catalogs, SLAs, indicators, permisos, headers HTTP)
- [x] Fase 12: Hash Chain en AuditLog (A4 - tamper-evident audit trail, validación de integridad)
- [x] Fase 13: M5-7 Schemas/Services/Routers (9 entities nuevas: Iniciativas, Auditorías, Temas)
- [x] Fase 14: FlujoEstatus (dynamic state machines, transiciones configurables)
- [x] Fase 15: IndicadorFormula (XXX-001 a XXX-005, KRI0025 configurables, JSON formulas)
- [x] Fase 16: FiltroGuardado (saved filters personales y compartidos para dashboards)
- [x] Fase 17: ConfiguracionIA — endpoint admin + ejecución AIProvider integrada en flujo de Threat Modeling (`POST /api/v1/sesion_threat_modelings/{id}/ia/suggest`)
- [x] Fase 18: DashboardConfig + visibilidad de widgets por rol — backend + `my-visibility` en home y en cada vista dedicada
- [x] Fase 19: Dashboards dinámicos — 9 vistas con drill-down jerárquico; exportación CSV acoplada en dashboards de vulnerabilidades, releases e iniciativas (permisos `*.export`); presets compartidos vía FiltroGuardado disponibles en API (`/filtros_guardados`) para capas de UI adicionales
- [x] Fase 23: Triaje FP — pistas por motor + UI vulnerabilidades
- [x] 71 entities total (40 nuevos + 31 del framework)
- [x] 41 schemas, 41 services, 41 routers completados
- [x] Soft delete universal, IDOR protection, audit logging (55+ services)
- [x] 80% OWASP coverage, 85% Auditabilidad (A1-A8 implementado)

---

### Próximas Fases (Bloques B-E)

#### Bloque B — Módulos Críticos (Fases 11-16) — ✅ COMPLETADO
- [x] **Fase 11**: SystemSetting ampliado (50+ keys: catalogs, SLAs, indicators, roles, IA config, headers HTTP)
- [x] **Fase 12**: Hash Chain en AuditLog + verificación de integridad (A4 implementado)
- [x] **Fase 13**: M5-7 Schemas/Services/Routers (9 entities nuevas: Iniciativas, Auditorías, Temas Emergentes)
- [x] **Fase 14**: FlujoEstatus (state machines dinámicos, transiciones configurables)
- [x] **Fase 15**: IndicadorFormula (XXX-001 a XXX-005, KRI0025 configurables con JSON formulas)
- [x] **Fase 16**: FiltroGuardado (saved filters personales y compartidos para dashboards)

#### Bloque C — Módulos Nuevos (Fases 17-20)
- [x] **Fase 17**: ConfiguracionIA (AIProvider abstraction, multi-proveedor: Ollama/Anthropic/OpenAI/OpenRouter)
- [x] **Fase 18**: DashboardConfig + visibilidad de widgets por rol (role-based panel visibility)
- [x] **Fase 19**: 9 Dashboards dinámicos con drill-down multidimensional (Ejecutivo, Equipo, Programas, etc.) + export CSV desde vistas clave
- [x] **Fase 20**: Permisos Granulares (module/action/widget level RBAC)

#### Bloque D — IA + Changelog (Fases 21-23)
- [x] **Fase 21**: ChangelogEntrada (platform changelog) + SistemaHealthMetric (system health dashboard)
- [x] **Fase 22**: Threat Modeling Asistido (endpoint IA estructurado + UI: `/sesion_threat_modelings` y detalle con `ia/suggest`, simulación y amenazas por sesión)
- [x] **Fase 23**: Triaje de Falsos Positivos (IA + pistas por motor `fuente` en el prompt, auditoría con `fuente`, UI `/vulnerabilidads` y detalle con triaje)

#### Bloque E — Testing + Finalización (Fases 24-26)
- [ ] **Fase 24**: E2E Testing de IA multi-proveedor (Ollama/Anthropic/OpenAI/OpenRouter)
- [ ] **Fase 25**: Testing Integral (80%+ coverage, OWASP S1-S25, A1-A8, IDOR per entity)
- [ ] **Fase 26**: Performance optimization + Documentation + Production readiness

---

### Métricas de Completud

| Métrica | Estado | Detalle |
|---------|--------|---------|
| **Entities** | 67/67 | ✅ 36 nuevas + 31 del framework (Bloque A-B completados) |
| **Schemas** | 41/41 | ✅ Bloque A-B completo + schemas de ConfiguracionIA y ejecución asistida |
| **Services** | 41/41 | ✅ CRUD + audit_action_prefix en cada uno |
| **Routers** | 41/41 | ✅ Endpoints GET/POST/PATCH/DELETE con IDOR |
| **Migraciones** | 18/27 | En progreso (Fase 18 completada, Bloque C iniciado) |
| **Testing** | ~436 | ✅ Suite `pytest` en Docker (`make test`); incluye dashboards, permisos, export CSV, jerarquía BRD, sesión TM + IA |
| **OWASP Coverage** | 80% | S1-S7, S10-S13, S21-S23 implementados |
| **Auditabilidad** | 85% | A1-A8 implementado en 55+ services |

---

### Próximos Pasos (Bloque C — Fase 19+)

**Estado actual:** suite backend estable (~436 tests en Docker). Documento de negocio: `Requerimientos de Negocio (BRD).md` en la raíz.

#### Avances recientes (alineación BRD + plan operativo)

- **Jerarquía §3.1 del BRD** en base de datos y API: Subdirección → Gerencia → Organización de plataforma → Célula; migración `f3a9c1d2e8b0` (ejecutar `alembic upgrade head`).
- **Permisos en dashboards:** todos los `GET /api/v1/dashboard/*` exigen `dashboards.view`. Si la tabla `roles` está vacía tras un `TRUNCATE` de tests, se hace **bootstrap** automático del catálogo de permisos y roles (`app/services/permission_seed.py`).
- **Visibilidad por rol en widgets:** `GET /api/v1/dashboard_configs/my-visibility` entrega overrides por rol para cada widget; la home y dashboards dedicados aplican estas reglas para mostrar/ocultar tarjetas y paneles.
- **Configuración IA administrable:** `GET/PUT /api/v1/admin/ia-config` para proveedor activo, modelo, temperatura, tokens y timeout (persistido en `system_settings` con auditoría).
- **Ejecución IA en flujo real:** `POST /api/v1/sesion_threat_modelings/{id}/ia/suggest` usa `AIProvider`, requiere permiso `ia.execute`, audita la invocación y puede marcar la sesión con `ia_utilizada=true`.
- **Threat Modeling asistido (Fase 22):** el endpoint `ia/suggest` entrega JSON estructurado STRIDE/DREAD y puede crear amenazas cuando `crear_amenazas=true`; el frontend incluye listado, detalle, panel IA y listado de amenazas filtrado por `sesion_id` (navegación en sidebar y Ctrl+K).
- **Triaje IA de falsos positivos (Fase 23):** `POST /api/v1/vulnerabilidads/{id}/ia/triage-fp` clasifica `false_positive|likely_real|needs_review` con pistas de FP específicas por motor (SAST/DAST/SCA/TM/MAST/Auditoria/Tercero), auditoría incluye `fuente`; en frontend: listado, detalle y panel de triaje (permiso `ia.execute`).
- **Dashboards fase 19 (base):** se agregaron endpoints para `team`, `program-detail`, `releases-table` y `releases-kanban` bajo `/api/v1/dashboard/*`, todos protegidos con `dashboards.view`.
- **Drill-down jerárquico BRD (backend):** dashboards de vulnerabilidades, ejecutivo, equipo, detalle de programa y releases aceptan filtros por jerarquía (`subdireccion_id`, `gerencia_id`, `organizacion_id`, `celula_id`) y devuelven `applied_filters`.
- **Drill-down jerárquico UI (dashboard home):** selector en cascada Subdirección→Gerencia→Organización→Célula persistido en `localStorage`, conectado a paneles ejecutivos, vulnerabilidades, equipo y releases.
- **Dashboards dedicados con drill-down:** rutas `/dashboards/executive`, `/dashboards/vulnerabilities`, `/dashboards/team`, `/dashboards/releases`, `/dashboards/programs`, `/dashboards/program-detail`, `/dashboards/initiatives` y `/dashboards/emerging-themes` reutilizan filtros jerárquicos persistidos y consumen endpoints filtrados.
- **Contexto jerárquico en M5/M7:** `Iniciativa` y `TemaEmergente` incluyen `celula_id` (migración `c5d9a4f2b7e1`) para habilitar filtros organizacionales reales en dashboards de iniciativas y temas emergentes.
- **Cobertura de vistas dedicadas:** rutas `/dashboards/*` para Ejecutivo, Vulnerabilidades, Equipo, Releases, Programas, Detalle de Programa, Iniciativas y Temas Emergentes.
- **Exportación con auditoría (A7):** habilitada en `vulnerabilidads`, `service_releases`, `iniciativas`, `etapa_releases`, `excepcion_vulnerabilidads` y `aceptacion_riesgos` vía `GET /export.csv` con permisos granulares (`vulnerabilities.export`/`releases.export`/`initiatives.export`) y registro de auditoría con filas + hash SHA-256.
- **Frontend:** hooks TanStack Query en `useAppDashboardPanels.ts` y tarjetas AppSec en la home (`/` del dashboard) consumiendo `/dashboard/executive` y `/dashboard/vulnerabilities`.
- **Exportación desde dashboards (Fase 19):** botones de descarga CSV en `/dashboards/vulnerabilities` (`/vulnerabilidads/export.csv`), `/dashboards/releases` (`/service_releases/export.csv`) e `/dashboards/initiatives` (`/iniciativas/export.csv`) con `fetch` credentialed; respeta permisos granulares de export.
- **Presets de drill-down (Fase 16 + dashboards):** en cada `HierarchyFiltersBar` se puede guardar y cargar la jerarquía (Subdirección→Célula) vía `FiltroGuardado` con `modulo` `dashboard:…` (p. ej. `dashboard:vulnerabilities`); carga/elimina presets y mantiene `localStorage` al aplicar.

#### Completado esta sesión (histórico):
1. **Bloque B tests** ✅ : Todos los 23 tests pasando
   - 7 tests FiltroGuardado (saved filters personales/compartidos)
   - 5 tests FlujoEstatus (state machines dinámicos)
   - 5 tests IndicadorFormula (XXX-001 a XXX-005, KRI0025)
   - 5 tests M5 Iniciativas (CRUD + ownership validation)

2. **Dashboards implementados (estado parcial)** : DashboardConfig + 6 endpoints base
   - ✅ DashboardConfig entity + services + router (super_admin only)
   - ✅ /dashboard/vulnerabilities (counts by severity, state, overdue)
   - ✅ /dashboard/releases (status distribution, pending/in-progress/completed)
   - ✅ /dashboard/initiatives (progress metrics)
   - ✅ /dashboard/emerging-themes (active/unmoved counts)
   - ✅ /dashboard/executive (KPIs: total vulns, critical count, SLA compliance)
   - ✅ /dashboard/programs (placeholder: total, avg completion, at risk)
   - ✅ 8 tests Phase 18 pasando (todos endpoints + auth)
   - ✅ 4 tests DashboardConfig (super_admin requirement, system-level config)

3. **Fixes realizados** ✅ :
   - Fixed: FiltroGuardado require_ownership con owner_field="usuario_id"
   - Fixed: ServiceRelease.estado → estado_actual (correct column name)
   - Fixed: Vulnerabilidad.fecha_vencimiento → fecha_limite_sla (correct column name)
   - Fixed: docker-compose.yml APPSEC_MASTER_KEY environment variable
   - Fixed: Password policy relajada para testing (completado antes de producción)

#### Completado esta sesión (Fases 19-21):
4. **Permisos granulares implementados** : module/action/widget level RBAC
   - Extensión de roles a 6 perfiles (super_admin, chief_appsec, lider_programa, analista, auditor, readonly).
   - Dependency `require_permission` implementada.
   - 5 tests superados.
5. **Fase 20 (Completa)** ✅ : ChangelogEntrada (platform changelog)
   - CRUD para super_admin, vistas públicas.
   - 7 tests superados.
6. **Fase 21 (Completa)** ✅ : SistemaHealthMetric (system health dashboard)
   - Endpoint de salud del sistema para administradores.
   - 2 tests superados.

#### Próximas fases:
7. **Bloque D** (Fases 22-24): IA multi-proveedor (Threat Modeling + FP Triage + E2E tests)
8. **Bloque E** (Fases 25-27): Testing integral + Performance + Documentación

**Tiempo estimado restante:** 4-6 días

---

## Principios de Diseño

1. **100% auditable** — toda acción deja huella; no existe operación sin trazabilidad.
2. **Configuración sobre código** — ningún parámetro operativo requiere modificar código.
3. **SoD como defensa por diseño** — los flujos críticos de aprobación están blindados contra conflictos de interés desde el nivel de servicio.
4. **Soft delete universal** — ningún dato se elimina físicamente; todo es recuperable y auditable.
5. **Defensa en profundidad** — validación Pydantic en backend + Zod en frontend; IDOR verificado en cada endpoint.
6. **IA como asistente, no como decisor** — el sistema funciona al 100% sin IA; la IA acelera análisis pero nunca toma decisiones autónomas.
7. **Framework como base inmutable** — los patrones no se reescriben, se extienden.

---

## Licencia

Proyecto privado — todos los derechos reservados.
