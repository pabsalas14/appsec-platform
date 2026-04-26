# Documentación de Dashboards - Índice Maestro

Documentación completa de la plataforma de dashboards para AppSec Platform.

**Actualizado:** Abril 2026  
**Versión:** 1.0

---

## 📚 Documentación Generada

### 1. Backend Endpoints - Fase 2
**Archivo:** `backend/docs/ENDPOINTS_DASHBOARDS.md` (26 KB)

Especificación completa de 24 endpoints implementados:
- 11 endpoints de Analytics (Dashboards 1-9)
- 6 endpoints de Configuration
- 7 endpoints de Dashboard Builder

**Incluye:**
- Estructura de request/response
- Parámetros y query strings
- Status codes y validaciones
- Ejemplos curl funcionales
- Performance benchmarks
- Filtros jerárquicos
- Esquemas Pydantic

**Para:** Desarrolladores backend, testers, integradores API

---

### 2. Backend README
**Archivo:** `backend/README.md` (9 KB)

Guía de desarrollo del backend:
- Quick start (local development)
- Project structure
- Development commands
- Testing strategy
- Arquitectura de capas
- Hard rules de seguridad
- Troubleshooting
- Deployment checklist

**Para:** Desarrolladores backend, DevOps

---

### 3. Frontend README
**Archivo:** `frontend/README.md` (10 KB)

Guía de desarrollo del frontend:
- Quick start
- Dashboards disponibles (9 totales)
- Structure & components
- Chart primitives (theme-aware)
- E2E testing con Playwright
- API integration
- Logging
- Kitchen Sink gallery

**Para:** Desarrolladores frontend, QA

---

### 4. Roadmap Fases 3-8
**Archivo:** `docs/PHASES_3_8.md` (15 KB)

Especificación de 22 nuevos endpoints (fases futuras):
- **Fase 3:** Module View Builder (4 endpoints)
- **Fase 4:** Custom Fields (4 endpoints)
- **Fase 5:** Formulas + Validation (3 endpoints)
- **Fase 6:** Catalog Builder (3 endpoints)
- **Fase 7:** Navigation Builder (3 endpoints)
- **Fase 8:** AI Automation Rules (5 endpoints)

**Incluye:**
- Request/response schemas
- Use cases y ejemplos
- Modelos de base de datos
- Impacto arquitectónico
- Security considerations
- Timeline y roadmap

**Para:** Product managers, arquitectos, stakeholders

---

## 🎯 Mapa de Lectura por Rol

### 👨‍💻 Desarrollador Backend

**Comienza aquí:**
1. `backend/README.md` → Quick start + estructura
2. `backend/docs/ENDPOINTS_DASHBOARDS.md` → Especificación de endpoints
3. `AGENTS.md` → Hard rules

**Luego:**
- Modelos: `backend/app/models/dashboard*.py`
- Servicios: `backend/app/services/dashboard*_service.py`
- Rutas: `backend/app/api/v1/dashboard*.py`

**Para implementar nuevos endpoints:**
- Ver `docs/PHASES_3_8.md` → diseño de fase
- Seguir scaffolding: `make new-entity NAME=X FIELDS="..."`
- Replicar patrón en dashboard.py o admin/dashboard_builder.py

---

### 👨‍💻 Desarrollador Frontend

**Comienza aquí:**
1. `frontend/README.md` → Quick start + dashboards
2. `backend/docs/ENDPOINTS_DASHBOARDS.md` → Entender APIs
3. `frontend/src/types/api.ts` → Tipos generados

**Luego:**
- Componentes: `frontend/src/components/charts/`
- Layout: `frontend/src/components/layout/`
- Dashboards: `frontend/src/app/(dashboard)/dashboards/*/page.tsx`
- Tests: `frontend/src/__tests__/e2e/`

**Para agregar nuevo dashboard:**
1. Ver endpoint en `backend/docs/ENDPOINTS_DASHBOARDS.md`
2. Crear página en `frontend/src/app/(dashboard)/dashboards/new-name/`
3. Usar types de `@/types/api`
4. Agregar E2E test
5. `make types` para regenerar (si hay cambios en backend)

---

### 🏗️ Arquitecto / Technical Lead

**Comienza aquí:**
1. `backend/README.md` → Arquitectura de capas
2. `backend/docs/ENDPOINTS_DASHBOARDS.md` → Resumen de endpoints
3. `docs/PHASES_3_8.md` → Roadmap y extensibilidad

**Profundiza:**
- ADRs en `docs/adr/` (especialmente ADR-0001, 0003, 0004)
- `AGENTS.md` → Hard rules de arquitectura
- Performance benchmarks en `backend/docs/ENDPOINTS_DASHBOARDS.md`

**Para decisiones de diseño:**
- Ver impacto arquitectónico en `docs/PHASES_3_8.md`
- Modelar según `backend/app/models/`
- Validar con test contract: `tests/test_contract.py`

---

### 🧪 QA / Tester

**Comienza aquí:**
1. `backend/docs/ENDPOINTS_DASHBOARDS.md` → Endpoints y ejemplos curl
2. `frontend/README.md` → E2E testing
3. `frontend/src/__tests__/e2e/dashboard-*.spec.ts` → Ejemplos de tests

**Herramientas:**
```bash
# Backend: Probar endpoints directamente
curl -X GET "http://localhost:8000/api/v1/dashboard/executive" \
  -H "Authorization: Bearer TOKEN"

# Frontend: E2E
npm run test:e2e

# Performance
make test  # Validar baselines
```

**Casos de prueba:**
- Status codes (200, 400, 401, 403, 404, 500)
- Parámetros opcionales vs requeridos
- Validaciones de request body
- Filtros jerárquicos
- Paginación
- Performance < 2s

---

### 📊 Product Manager

**Comienza aquí:**
1. `docs/PHASES_3_8.md` → Visión de fases
2. `backend/docs/ENDPOINTS_DASHBOARDS.md` → Resumen de endpoints actuales
3. `frontend/README.md` → Dashboards disponibles

**Para feature requests:**
- Alinearse con tabla de fases en `docs/PHASES_3_8.md`
- Proponer usando estructura de "Fase X: Nombre"
- Agregar requests/responses esperados

---

### 👨‍💼 Stakeholder / Management

**Comienza aquí:**
1. `docs/PHASES_3_8.md` → Timeline y roadmap
2. Este documento → Qué se entrega y cuándo

**Hitos:**
- ✅ Fase 1-2: Completadas (24 endpoints)
- 📅 Fase 3-8: Q2-Q3 2026 (22 endpoints)
- 🎯 Total: 46 endpoints

**Valor entregado:**
- 9 dashboards de análisis
- Personalización por rol
- Dashboards personalizados
- Vistas temáticas
- Automatización AI
- Catálogos centralizados

---

## 📈 Resumen Ejecutivo

### Endpoints Implementados (Fase 2)

```
Total: 24 endpoints
├─ Analytics: 11 (Dashboards 1-9 + stats)
├─ Configuration: 6 (Visibilidad por rol)
└─ Builder: 7 (Personalización + acceso)
```

**Performance:**
- Todos < 2 segundos en producción
- Índices optimizados en PostgreSQL
- Caché de resultados (300-600s TTL)

**Seguridad:**
- Autenticación: JWT en cookies (ADR-0010)
- Autorización: RBAC por endpoint
- Auditoría: Todas las mutaciones logueadas
- CSRF: Double-submit para POST/PATCH/DELETE

### Endpoints Planificados (Fases 3-8)

```
Total: 22 nuevos endpoints
├─ Fase 3 (Module View): 4 endpoints
├─ Fase 4 (Custom Fields): 4 endpoints
├─ Fase 5 (Formulas): 3 endpoints
├─ Fase 6 (Catalogs): 3 endpoints
├─ Fase 7 (Navigation): 3 endpoints
└─ Fase 8 (AI Rules): 5 endpoints
```

**Timeline:** Q2-Q3 2026
**Impacto:** Base de datos, servicios, rutas, tests

---

## 🔍 Búsqueda por Concepto

### ¿Cómo agrego un nuevo endpoint?

1. **Diseño:** Ver `docs/PHASES_3_8.md` para estructura
2. **Backend:**
   - Crear modelo: `make new-entity NAME=X FIELDS="..."`
   - Crear ruta en `app/api/v1/admin/`
   - Crear servicio en `app/services/`
3. **Frontend:**
   - `make types` para regenerar tipos
   - Crear componente/página
4. **Tests:**
   - `tests/test_contract.py` para auth
   - `tests/test_ownership.py` para IDOR
   - E2E test en frontend

---

### ¿Dónde están los tipos?

**Generados (NO editar):** `frontend/src/types/api.ts`
- Se regeneran con `make types`
- Basados en OpenAPI del backend

**Manual:** `frontend/src/types/index.ts`
- Re-exporta de `api.ts`
- Agrega tipos app-específicos

---

### ¿Cómo cambio un endpoint?

1. **Backend:**
   - Editar ruta en `app/api/v1/`
   - Editar servicio en `app/services/`
   - Crear migración si toca BD: `alembic revision --autogenerate -m "..."`
2. **Frontend:**
   - `make types` para regenerar
   - Actualizar componentes que lo usen
   - Actualizar tests

---

### ¿Dónde veo performance?

`backend/docs/ENDPOINTS_DASHBOARDS.md` → sección "Performance Benchmarks"

Tabla con:
- Endpoint
- Tiempo esperado
- Índices requeridos

Si un endpoint es lento:
1. Revisar índices: `\d+ tabla` en psql
2. Analizar plan: `EXPLAIN ANALYZE SELECT ...`
3. Agregar índice + migración
4. Re-benchmark

---

### ¿Cómo logueo eventos?

**Backend:**
```python
from app.core.logging import logger

logger.info("dashboard.view", extra={
    "event": "dashboard.view",
    "user_id": str(user.id),
    "dashboard_name": "executive"
})
```

**Frontend:**
```typescript
import { logger } from '@/lib/logger';

logger.info('dashboard.view', { dashboardId: '123' });
```

---

## 🛠️ Comandos Rápidos

```bash
# Setup
make up              # Levantar stack
make seed            # Crear admin + data

# Development
make types           # Regenerar tipos frontend
make test            # Tests backend
npm run test:e2e     # Tests E2E frontend
npm run lint         # Lint + type check

# Deployment
make up-prod         # Build producción
docker compose push  # Push imagen

# Cleanup
make down            # Parar servicios
make clean           # Borrar volúmenes (destructivo)
```

---

## 📞 Support

### Errores Comunes

| Problema | Solución |
|----------|----------|
| Tipos desactualizados | `make types` |
| Tests fallan | `make clean && make up && make seed && make test` |
| Backend no inicia | `docker compose logs backend` |
| CORS error | Verificar `NEXT_PUBLIC_API_URL` |
| Queries lentas | Ver benchmarks en `backend/docs/` |

### Contacto

- Backend issues: `@backend-team`
- Frontend issues: `@frontend-team`
- Arquitectura: `@tech-lead`

---

## 📋 Checklist: Antes de ir a Producción

### Backend
- [ ] Todos los endpoints retornan envelope (success/error)
- [ ] Auth: `get_current_user` o `require_role` o `require_permission`
- [ ] Ownership: Entidades owned tienen `require_ownership` en mutaciones
- [ ] Transacciones: No hay `db.commit()` fuera de `database.py`
- [ ] Logging: Usa `logger.info()`, no `print()`
- [ ] Tests pasan: `make test`
- [ ] Migraciones aplicadas: `alembic upgrade head`

### Frontend
- [ ] Tipos regenerados: `make types`
- [ ] Lint pasa: `npm run lint`
- [ ] Type check pasa: `npm run tsc`
- [ ] E2E tests pasan: `npm run test:e2e`
- [ ] Build funciona: `npm run build`

### Infraestructura
- [ ] Índices creados en BD
- [ ] Performance < 2s
- [ ] Backups programados
- [ ] Logs centralizados
- [ ] Rate limiting configurado
- [ ] CORS correcto
- [ ] Certificados SSL/TLS

---

## 📚 Archivos de Referencia

```
.
├── backend/
│   ├── README.md                                  ← Guía backend
│   ├── docs/ENDPOINTS_DASHBOARDS.md              ← Endpoints Fase 2 (24)
│   ├── app/
│   │   ├── api/v1/dashboard.py                   ← Analytics endpoints
│   │   ├── api/v1/dashboard_config.py            ← Config endpoints
│   │   └── api/v1/admin/dashboard_builder.py     ← Builder endpoints
│   ├── app/models/dashboard*.py
│   ├── app/services/dashboard*_service.py
│   └── tests/test_bloque_c_dashboards.py
├── frontend/
│   ├── README.md                                  ← Guía frontend
│   ├── src/components/charts/                     ← Chart primitives
│   ├── src/components/layout/                     ← UI shell
│   ├── src/app/(dashboard)/dashboards/            ← 9 dashboards
│   ├── src/types/api.ts                          ← Tipos generados
│   └── src/__tests__/e2e/dashboard-*.spec.ts     ← E2E tests
├── docs/
│   ├── PHASES_3_8.md                              ← Roadmap futuro
│   ├── adr/README.md                              ← Architecture decisions
│   └── SECURITY_CHECKLIST.md
├── README.md                                      ← Raíz
└── AGENTS.md                                      ← Hard rules
```

---

## ✅ Documentación Completada

| Documento | Líneas | Scope | Status |
|-----------|--------|-------|--------|
| `backend/docs/ENDPOINTS_DASHBOARDS.md` | 800+ | 24 endpoints + fases futuras | ✅ |
| `backend/README.md` | 400+ | Setup, testing, deployment | ✅ |
| `frontend/README.md` | 450+ | Dashboards, components, testing | ✅ |
| `docs/PHASES_3_8.md` | 600+ | 22 endpoints futuros | ✅ |
| Este documento | 300+ | Índice maestro | ✅ |

**Total:** 2,850+ líneas de documentación

---

## 🎯 Next Steps

1. **Compart documentación** con el equipo
2. **Revisar** endpoints en `backend/docs/ENDPOINTS_DASHBOARDS.md`
3. **Comenzar Fase 3** (Module Views) en Q2 2026
4. **Actualizar** esta documentación después de cada fase

---

**Documentación generada:** Abril 2026  
**Versión:** 1.0  
**Mantenedor:** Equipo de plataforma AppSec
