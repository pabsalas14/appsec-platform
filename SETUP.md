# 🚀 AppSec Platform - Local Development Setup

Quick guide para setup local del AppSec Platform con SCR completo.

**Tabla de contenidos:**
1. [Prerequisites](#prerequisites)
2. [Setup Inicial](#setup-inicial)
3. [Environment Variables](#environment-variables)
4. [Docker Setup](#docker-setup)
5. [Database & Migrations](#database--migrations)
6. [Running Tests](#running-tests)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Asegúrate de tener instalado:

- **Docker & Docker Compose** (v20.10+)
- **Git** (para clonar el repo)
- **Node.js** (v18+) - para frontend local development
- **Python** (v3.11+) - para backend local development
- **Make** (para comandos simplificados)

**Verificar instalaciones:**
```bash
docker --version
docker compose --version
git --version
node --version
python --version
```

---

## Setup Inicial

### 1. Clonar repositorio
```bash
git clone https://github.com/pabsalas14/appsec-platform.git
cd appsec-platform
```

### 2. Crear archivo .env
```bash
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores (API keys, DB credentials, etc)
```

### 3. Crear directorio para uploads
```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```

---

## Environment Variables

**Mínimo requerido para desarrollo:**

```bash
# .env file en raíz del proyecto
DATABASE_URL=postgresql://appsec:appsec_password@postgres:5432/appsec_db
SECRET_KEY=development-secret-key-min-32-chars-long
ANTHROPIC_API_KEY=sk-ant-xxxxx
GITHUB_OAUTH_CLIENT_ID=Iv1.xxxxx
```

**Generar SECRET_KEY seguro:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Docker Setup

### Opción 1: Docker Compose (Recomendado)

**Iniciar todos los servicios:**
```bash
docker compose up -d

# Esperar que postgres esté healthy:
docker compose exec postgres pg_isready
```

**Servicios levantados:**
- `backend` → http://localhost:8000
- `frontend` → http://localhost:3000
- `postgres` → localhost:5432
- `redis` → localhost:6379
- `celery` → background tasks

**Ver logs:**
```bash
docker compose logs -f backend    # Backend logs
docker compose logs -f frontend   # Frontend logs
docker compose logs -f celery     # Celery worker logs
```

**Detener:**
```bash
docker compose down
```

### Opción 2: Local Development (Python + Node)

**Backend:**
```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Start server
python -m uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
# Install dependencies
cd frontend
npm install

# Start dev server
npm run dev  # http://localhost:3000
```

**Requisitos para local:**
- PostgreSQL local (o `docker run postgres`)
- Redis local (o `docker run redis`)

---

## Database & Migrations

### Aplicar migraciones

```bash
# Con Docker
docker compose exec backend alembic upgrade head

# Local
cd backend
alembic upgrade head
```

### Ver estado de migraciones
```bash
docker compose exec backend alembic current
docker compose exec backend alembic branches
```

### Crear nueva migración
```bash
docker compose exec backend alembic revision --autogenerate -m "description"
```

### Revertir última migración
```bash
docker compose exec backend alembic downgrade -1
```

---

## Database Seeding

### Seed data de desarrollo
```bash
docker compose exec backend python -m app.cli.seed
```

### Seed data de tests (volumen masivo)
```bash
docker compose exec backend python -m app.cli.seed-uat
```

---

## Running Tests

### Backend Tests

**Todos los tests:**
```bash
docker compose exec backend pytest backend/tests -v
```

**Tests específicos:**
```bash
docker compose exec backend pytest backend/tests/test_code_security_review.py -v
```

**Con coverage:**
```bash
docker compose exec backend pytest --cov=app --cov-report=html backend/tests
# Luego abrir htmlcov/index.html
```

**Tests de un módulo:**
```bash
docker compose exec backend pytest backend/tests -k "scr" -v
```

### Frontend Tests

**E2E Tests (Playwright):**
```bash
cd frontend
npm run test:e2e
```

**Unit Tests:**
```bash
cd frontend
npm run test
```

**Linting + Type Check:**
```bash
cd frontend
npm run lint
npm run typecheck
```

---

## Development Workflow

### 1. Agregar nueva feature en Backend

```bash
# Crear rama
git checkout -b feat/my-feature

# Hacer cambios en backend/
# ...

# Reconstruir imagen si cambió app.py, requirements.txt, etc
docker compose build backend

# Reiniciar servicio
docker compose restart backend

# Ver logs
docker compose logs -f backend

# Run tests
docker compose exec backend pytest backend/tests/test_my_feature.py -v

# Commit
git add .
git commit -m "feat: add my feature"

# Push
git push origin feat/my-feature
```

### 2. Agregar nueva feature en Frontend

```bash
# Crear rama
git checkout -b feat/my-feature

# Instalar dependencias si cambió package.json
cd frontend && npm install

# Hacer cambios
# ...

# Run linting
npm run lint

# Run tests
npm run test

# Build para verificar
npm run build

# Commit
git add .
git commit -m "feat: add my feature"

# Push
git push origin feat/my-feature
```

### 3. Probar integración completa

```bash
# 1. Backend + DB + Cache listo
docker compose up -d

# 2. Frontend conectando a backend
cd frontend
npm run dev

# 3. Abrir http://localhost:3000 en navegador

# 4. Ejecutar E2E tests
npm run test:e2e

# 5. Ver Swagger API
http://localhost:8000/docs
```

---

## Troubleshooting

### Docker Issues

**Problema:** `docker-compose: command not found`
```bash
# Actualizar Docker
docker compose version
# Debe ser v2+ (no v1)
```

**Problema:** `postgres connection refused`
```bash
# Esperar a que postgres esté listo
docker compose exec postgres pg_isready -U appsec

# O reiniciar postgres
docker compose restart postgres
```

**Problema:** `port already in use`
```bash
# Encontrar qué usa el puerto
lsof -i :8000
lsof -i :3000

# Matar proceso
kill -9 <PID>

# O cambiar puerto en docker-compose.yml
ports:
  - "9000:8000"  # usa 9000 en local
```

### Database Issues

**Problema:** `no such table: code_security_reviews`
```bash
# Migraciones no corrieron
docker compose exec backend alembic upgrade head

# Verificar estado
docker compose exec backend alembic current
```

**Problema:** `foreign key constraint failed`
```bash
# BD corrupta, reset seguro
docker compose exec backend alembic downgrade base
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.cli.seed
```

### Frontend Issues

**Problema:** `Cannot find module '@/services/api'`
```bash
cd frontend
npm install
npm run dev
```

**Problema:** `ENOENT: no such file or directory`
```bash
# Limpiar node_modules
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Celery Task Issues

**Problema:** Tareas no procesan
```bash
# Ver worker logs
docker compose logs -f celery

# Reiniciar worker
docker compose restart celery

# Verificar Redis está en pie
docker compose exec redis redis-cli ping
```

---

## Performance Optimization

### Desarrollo rápido

1. **Backend sin rebuild**
   - Si solo cambias `app/` (no `requirements.txt`), no necesitas rebuild
   - `docker compose restart backend` suficiente

2. **Frontend hot reload**
   - Next.js automáticamente recarga en cambios
   - No necesitas restart

3. **Usar `--build` con cuidado**
   ```bash
   docker compose up --build backend  # Solo rebuild backend
   ```

### Debugging

**Backend debugger:**
```python
# En código Python
import pdb; pdb.set_trace()

# Luego en terminal:
docker compose logs -f backend
# Ve el prompt pdb y escribe comandos
```

**Frontend debugger:**
```typescript
// En código React/TypeScript
debugger;

# Luego:
# - Abre DevTools (F12)
# - Ejecuta acción que trigger debugger
# - Step through código
```

---

## Next Steps

1. ✅ Setup local completado
2. ⏭️ Lee `docs/API.md` para especificación de endpoints
3. ⏭️ Lee `docs/ARCHITECTURE.md` para entender estructura
4. ⏭️ Abre issue o PR para contribuir

---

## Soporte

- 📖 [README.md](./README.md) - Overview del proyecto
- 📚 [docs/API.md](./docs/API.md) - Documentación de API
- 🏗️ [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitectura
- 🐛 [GitHub Issues](https://github.com/pabsalas14/appsec-platform/issues) - Reportar bugs

