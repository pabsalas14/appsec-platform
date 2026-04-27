# Backend - AppSec Platform

Python FastAPI backend para la plataforma de gestión de ciberseguridad aplicativa.

**Stack:** FastAPI 0.112 + SQLAlchemy Async 2.0 + Pydantic v2 + Alembic + PostgreSQL 16

---

## 🚀 Quick Start

### Desarrollo local

```bash
# 1. Levantar stack (docker compose con hot-reload)
make up

# 2. Crear usuario admin + seed data
make seed

# 3. Verificar que el backend esté corriendo
curl http://localhost:8000/docs
```

### Parar servicios

```bash
make down
make clean  # ⚠️ Destructivo - borra todos los volúmenes
```

---

## 📊 Dashboard Endpoints

### Documentación Completa

Ver **[docs/ENDPOINTS_DASHBOARDS.md](docs/ENDPOINTS_DASHBOARDS.md)** para:

- 24 endpoints implementados (Analytics, Config, Builder)
- Esquemas de request/response
- Ejemplos curl completos
- Status codes y errores
- Performance benchmarks
- Roadmap de fases 3-8

### Resumen Rápido

| Categoría | Endpoints | Descripción |
|-----------|-----------|-------------|
| **Analytics** | 11 | Dashboards 1-9 + stats (KPIs, vulnerabilidades, releases, etc.) |
| **Configuration** | 6 | Visibilidad de widgets por rol (CRUD + my-visibility) |
| **Builder** | 7 | Dashboards personalizados, acceso, configuración |

### Ejemplo: Obtener Dashboard Ejecutivo

```bash
curl -X GET "http://localhost:8000/api/v1/dashboard/executive" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Performance esperado

```
GET /dashboard/stats              < 200ms
GET /dashboard/executive          < 500ms
GET /dashboard/vulnerabilities    < 500ms
GET /dashboard/releases           < 300ms
GET /dashboard/programs           < 600ms

Todos < 2 segundos en prod (100k registros)
```

---

## 🏗️ Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py                    # get_current_user, require_role, require_permission
│   │   └── v1/
│   │       ├── dashboard.py           # Analytics: 11 endpoints
│   │       ├── dashboard_config.py    # Config: 6 endpoints
│   │       └── admin/
│   │           └── dashboard_builder.py  # Builder: 7 endpoints
│   ├── models/
│   │   ├── dashboard_config.py
│   │   ├── custom_dashboard.py
│   │   └── custom_dashboard_access.py
│   ├── schemas/
│   │   ├── dashboard_config.py
│   │   ├── custom_dashboard.py
│   │   └── custom_dashboard_access.py
│   ├── services/
│   │   ├── base.py                    # BaseService genérico (CRUD + ownership)
│   │   ├── dashboard_config_service.py
│   │   ├── custom_dashboard_service.py
│   │   └── custom_dashboard_access_service.py
│   ├── core/
│   │   ├── response.py                # success(), paginated(), error() envelopes
│   │   ├── exceptions.py              # HTTPException subclases
│   │   ├── permissions.py             # P.DASHBOARDS.VIEW, etc.
│   │   ├── logging.py                 # Logger estructurado
│   │   └── cookies.py                 # Solo lugar permitido para set_cookie()
│   ├── main.py                        # FastAPI app + error handlers
│   └── database.py                    # AsyncSession + get_db() (único lugar con commit)
├── alembic/
│   └── versions/                      # Migraciones (una por modelo)
├── tests/
│   ├── conftest.py
│   ├── test_contract.py               # Validación de envelopes + auth
│   ├── test_ownership.py              # IDOR prevention
│   └── test_bloque_c_dashboards.py   # Smoke tests
├── docs/
│   └── ENDPOINTS_DASHBOARDS.md        # ← Documentación de endpoints
├── Dockerfile
├── requirements.txt
└── .env.example
```

---

## 🛠️ Development Commands

### Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Generate database migrations
docker compose exec backend alembic revision --autogenerate -m "add new model"
docker compose exec backend alembic upgrade head
```

### Testing

```bash
# Run all tests (pytest)
make test

# ⚠️ Trunca users, tasks, refresh_tokens entre tests
# Solo ejecutar contra DB disposable (dev compose está bien)
# Después: make seed para restaurar admin
```

### Type Generation

```bash
# Regenerar frontend/src/types/api.ts desde OpenAPI
make types
```

### Linting

```bash
cd backend
ruff check .          # Lint
ruff format .         # Format
```

---

## 📚 Arquitectura de Capas

```
HTTP Request
    ↓
Router (api/v1/*.py)
  ├─ Valida input (Pydantic)
  ├─ Llama a service
  └─ Retorna via success()/paginated()/error()
    ↓
Service (services/*.py)
  ├─ Lógica de negocio
  ├─ SOLO flush(), NO commit()
  └─ Levanta excepciones de negocio
    ↓
Database (database.py::get_db)
  ├─ AsyncSession con transacción
  └─ SOLO commit() aquí (ADR-0003)
    ↓
PostgreSQL
```

### Responsabilidades

| Layer | Qué hace | Qué NO hace |
|-------|----------|-----------|
| **Router** | Valida, wirea deps, retorna envelope | Lógica de negocio |
| **Service** | Toca DB, lógica | Levanta HTTP exceptions |
| **get_db** | Crea sesión + commit final | Excepciones de negocio |

---

## 🔐 Seguridad (Hard Rules)

### 1. Autenticación & Autorización

- ✅ **ADR-0001:** Todo endpoint `/api/v1/*` depende de `get_current_user` o `require_role`
- ✅ **ADR-0010:** Cookies solo, sin tokens en JSON
- ✅ **ADR-0010:** Mutaciones requieren CSRF (cookie + header)

```python
# ✅ Correcto
@router.get("/dashboard/stats")
async def stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW))
):
    ...

# ❌ Incorrecto - falta require_permission
@router.get("/dashboard/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    ...
```

### 2. Transacciones

- ✅ **ADR-0003:** SOLO `db.commit()` en `app/database.py::get_db()`
- Services usan `db.flush()` para validaciones

```python
# ✅ Correcto (service)
await db.flush()  # Valida constraints, no commitea

# ❌ Incorrecto
await db.commit()  # En service = test falla
```

### 3. Ownership (IDOR prevention)

- ✅ **ADR-0004:** Entidades owned declaran `owner_field` en service
- ✅ **ADR-0004:** Router usa `require_ownership` en mutaciones

```python
# ✅ Correcto
svc = BaseService[Task, TaskCreate, TaskUpdate](
    Task,
    owner_field="user_id",
    audit_action_prefix="task",
)

# En router:
@router.patch("/{id}")
async def update(
    id: UUID,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_ownership(Task, "user_id"))
):
    ...
```

### 4. Logging

- ✅ **ADR-0007:** `from app.core.logging import logger` (nunca `print()`)
- Nunca loguear tokens, passwords, cookies

```python
from app.core.logging import logger

logger.info("dashboard.view", extra={"event": "dashboard.view", "user_id": str(user.id)})
```

### 5. Response Envelopes

- ✅ **ADR-0001:** Todos los responses usan `success()`, `paginated()`, `error()`

```python
from app.core.response import success, paginated, error

return success(data)  # 200
return success(data, status_code=201)  # 201
return paginated(items, total, page, page_size)  # Paginado
return error("Not found", status_code=404)  # Error
```

---

## 📖 Guía de Escalado

### Para agregar nuevo dashboard endpoint

1. **Crear modelo** (si no existe):
   ```bash
   make new-entity NAME=MyEntity FIELDS="field1:type,field2:type"
   ```

2. **Agregar ruta en** `app/api/v1/dashboard.py`:
   ```python
   @router.get("/my-dashboard")
   async def my_dashboard(
       db: AsyncSession = Depends(get_db),
       current_user: User = Depends(require_permission(P.DASHBOARDS.VIEW))
   ):
       # Lógica
       return success({...})
   ```

3. **Indexar columnas usadas en WHERE/ORDER BY:**
   ```bash
   docker compose exec backend alembic revision --autogenerate -m "index dashboard columns"
   docker compose exec backend alembic upgrade head
   ```

4. **Registrar en tests** (`tests/test_bloque_c_dashboards.py`):
   ```python
   async def test_my_dashboard_returns_200(client, admin_token):
       response = await client.get(
           "/api/v1/dashboard/my-dashboard",
           headers={"Authorization": f"Bearer {admin_token}"}
       )
       assert response.status_code == 200
   ```

5. **Regenerar tipos frontend:**
   ```bash
   make types
   ```

---

## 🧪 Testing Strategy

### Categorías de Tests

1. **test_contract.py** - Validación de envelopes + auth guards (ADR-0001)
2. **test_ownership.py** - IDOR prevention (ADR-0004)
3. **test_bloque_c_dashboards.py** - Smoke tests de dashboards
4. **test_*.py** - Entidad-específicos (CRUD básico)

### Ejecutar

```bash
# Todos
make test

# Solo dashboards
docker compose exec backend pytest tests/test_bloque_c_dashboards.py -v

# Con coverage
docker compose exec backend pytest --cov=app tests/
```

### Key Points

- Cada test se ejecuta contra una transacción aislada
- `conftest.py` usa `NullPool` para evitar problemas async
- Tablas `users`, `tasks`, `refresh_tokens` se truncan entre tests
- **Después de `make test`, ejecutar `make seed` para restaurar admin**

---

## 🔍 Troubleshooting

### Backend no inicia

```bash
# Ver logs del contenedor
docker compose logs backend

# Verificar schema
docker compose exec backend alembic current
docker compose exec backend alembic history

# Rollback último
docker compose exec backend alembic downgrade -1
```

### Tests fallan con "database already exists"

```bash
# Limpiar volúmenes
make clean

# Recrear
make up
make seed
```

### Queries lentas

1. Verificar índices:
   ```sql
   \d+ tabla  -- En psql
   ```

2. Analizar plan:
   ```sql
   EXPLAIN ANALYZE SELECT ...;
   ```

3. Agregar índice:
   ```python
   # En modelo
   __table_args__ = (
       Index("idx_col1_col2", "col1", "col2"),
   )
   ```

4. Migrar:
   ```bash
   docker compose exec backend alembic revision --autogenerate -m "add index"
   docker compose exec backend alembic upgrade head
   ```

---

## 📝 Environment Variables

Crear `.env` basado en `.env.example`:

```bash
# Core
DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/appdb
JWT_SECRET_KEY=your-secret-key-min-32-chars
ENVIRONMENT=development

# API
API_TITLE=AppSec Platform
API_VERSION=1.0.0
ALLOW_OPENAPI_IN_PROD=false

# Mail (si aplica)
SMTP_HOST=smtp.example.com
SMTP_PORT=587

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

---

## 🚀 Deployment

### Production Checklist

- [ ] `ENVIRONMENT=production`
- [ ] `ALLOW_OPENAPI_IN_PROD=false` (fail-closed, ADR-0013)
- [ ] Índices de BD creados y analizados
- [ ] Tests pasan: `make test`
- [ ] Tipos frontend regenerados: `make types`
- [ ] Migraciones aplicadas: `alembic upgrade head`
- [ ] Rate limiting configurado
- [ ] Logs centralizados (structured JSON)
- [ ] Backups de BD programados

### Image Production

```bash
# Ver `docker-compose.yml` y `docker-compose.prod.yml`
# El backend se build SIN bind-mount de código
# → Rebuild necesario después de cambios

docker compose build backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 📚 Recursos

- **Arquitectura:** `/docs/adr/README.md`
- **Hard Rules:** `/AGENTS.md`
- **Endpoints:** `/backend/docs/ENDPOINTS_DASHBOARDS.md` ← **AQUÍ**
- **Permisos:** `/docs/security/PERMISSIONS_MATRIX.md`
- **Seguridad:** `/docs/SECURITY_CHECKLIST.md`

---

## 🤝 Contributing

Antes de pushear:

```bash
# Format + Lint
ruff format .
ruff check --fix .

# Tests
make test

# Tipos frontend
make types

# Commit
git add .
git commit -m "feat: brief description"
```

---

**Versión:** 1.0  
**Actualizado:** Abril 2026  
**Mantenedor:** Equipo de plataforma AppSec
