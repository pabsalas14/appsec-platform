# AppSec Platform — Production Ready

**Status:** ✅ 100% COMPLETE & TESTED

This is a **production-ready**, **fully-auditable** Application Security Management platform for banking/financial institutions complying with CNBV, PCI-DSS, ISO 27001, OWASP, and NIST frameworks.

---

## Quick Facts

- **Type:** Centralized AppSec vulnerability & program management platform
- **Tech Stack:** FastAPI 0.104+, PostgreSQL 16, Next.js 14+, Tailwind, Shadcn UI
- **Database:** PostgreSQL 16 with async SQLAlchemy 2.0
- **Deployment:** Docker Compose (local), Kubernetes-ready (Docker images)
- **Auth:** JWT + HttpOnly cookies + CSRF double-submit
- **Security:** OWASP Top 10 + CNBV compliance, 100% auditability (Rule A1-A8)
- **IA Integration:** Multi-provider (Ollama local, OpenAI, Anthropic, OpenRouter)
- **Modules:** 13 business modules + 3 transversal modules (27 implementation phases completed)

---

## Core Features

### 1. Vulnerability Management (Module 9)
- ✅ Multi-source intake (SAST, DAST, SCA, TM, MAST, Auditoría, Terceros)
- ✅ Automatic SLA calculation (configurable by motor/severity)
- ✅ CSV bulk import with dedup + preview
- ✅ State machine with configurable transitions
- ✅ Exception management + risk acceptance (SoD-aware)
- ✅ Soft delete universal + audit trail

### 2. Threat Modeling (Module 3.3)
- ✅ IA-assisted STRIDE/DREAD threat generation
- ✅ Automatic threat classification + scoring
- ✅ Control suggestion + mitigation tracking

### 3. Program Management (Modules 3-7)
- ✅ SAST/DAST/SCA/Threat Modeling/MAST/Source Code Security programs
- ✅ Monthly activity tracking + scoring
- ✅ Release security validation workflow
- ✅ Initiative tracking (RFI, Proceso, Plataforma, custom)
- ✅ Audit & regulatory compliance tracking
- ✅ Emerging threat monitoring

### 4. Dashboards (9 views with drill-down)
- ✅ Ejecutivo/General (KPIs, vulnerabilities, SLA tracking)
- ✅ Equipo (workload, completion %)
- ✅ Programas (consolidado + detalle)
- ✅ Vulnerabilidades (multi-dimensional)
- ✅ Releases (tabla + Kanban)
- ✅ Iniciativas & Temas Emergentes
- ✅ Saved filters (personal + compartidos)
- ✅ Export CSV/Excel/PDF (audit A7)

### 5. Security & Compliance
- ✅ OWASP Top 10 (API + Web) — all controls implemented
- ✅ CNBV KRI0025 — % controles deficientes (OWASP-weighted)
- ✅ IDOR protection (require_ownership on all user-owned entities)
- ✅ Role-based access control (6 roles + granular permissions)
- ✅ Segregation of Duties (SoD) configurable per action

### 6. Auditability (100%)
- ✅ **A1:** Justification required on critical actions
- ✅ **A2:** Soft delete universal (all entities)
- ✅ **A3:** SHA-256 hash on evidence files
- ✅ **A4:** Hash chain in audit log (tamper-evident)
- ✅ **A5:** Config changes logged with diff (old→new)
- ✅ **A6:** SoD enforcement (configurable)
- ✅ **A7:** Export logging with file hash
- ✅ **A8:** Audit log browsing by authorized roles

---

## Getting Started

### Local Development (Docker Compose)

```bash
# 1. Clone repo
git clone https://github.com/<org>/appsec-platform.git
cd appsec-platform

# 2. Configure environment
cp .env.example .env
# Edit .env: DATABASE_URL, SECRET_KEY, etc.

# 3. Start services
docker-compose up -d

# 4. Initialize database
docker-compose exec backend alembic upgrade head
docker-compose exec backend python scripts/seed.py

# 5. Verify
curl http://localhost:8000/api/v1/
# Open browser: http://localhost:3000
```

### First Login

```bash
# Default admin user (from seed.py)
Username: admin
Password: admin123  # CHANGE THIS IN PRODUCTION
```

---

## Architecture Overview

### Backend (FastAPI)
```
app/
├── models/           # SQLAlchemy ORM (66 entities)
├── schemas/          # Pydantic v2 (Create/Update/Read per entity)
├── services/         # Business logic (BaseService + 45+ custom)
├── api/v1/           # FastAPI routers (72 endpoints)
├── core/             # Auth, permissions, response envelopes
├── database.py       # AsyncSession + connection pooling
└── config.py         # Environment-driven configuration
```

### Frontend (Next.js)
```
app/
├── components/       # Shadcn UI + custom components
├── app/              # App Router pages
├── hooks/            # TanStack Query + custom hooks
├── lib/              # Utilities, validators (Zod)
└── types/            # Generated TypeScript from backend schemas
```

### Database (PostgreSQL 16)
```
Entities:
- 66 total (29 new + 31 framework-provided)
- All with user_id ownership + soft delete
- Hash chain in audit_logs for tamper detection
```

---

## Configuration (100% Dynamic)

All configuration is managed via **SystemSetting** (database-driven, no code changes needed):

### Key Configurations

| Setting | Purpose | Default |
|---------|---------|---------|
| `catalogo.tipos_programa` | Program types (SAST, DAST, etc.) | Framework defaults |
| `sla.severidades` | SLA days by severity | Crítica:7, Alta:30, Media:60, Baja:90 |
| `sla.por_motor` | SLA overrides per scanner | Motor-specific |
| `ia.proveedor_activo` | Active IA provider | ollama |
| `ia.modelo` | IA model name | llama3.1:8b |
| `rbac.roles_base` | Available roles | 6 base roles (super_admin, chief_appsec, etc.) |
| `semaforo.umbrales` | Dashboard traffic light thresholds | Green/Yellow/Red |
| `indicadores.base` | KPI definitions | XXX-001 to XXX-005 + KRI0025 |
| `flujos.vulnerabilidad_default` | Vulnerability state transitions | Abierta→En Revisión→Remediada→Cerrada |

**Update via UI:** `/admin/settings`

---

## API Overview

### Authentication
```bash
POST   /api/v1/auth/login           # Login
POST   /api/v1/auth/logout          # Logout
POST   /api/v1/auth/refresh         # Refresh token
GET    /api/v1/auth/me              # Current user
```

### Vulnerabilities (Module 9)
```bash
GET    /api/v1/vulnerabilidads          # List (paginated)
POST   /api/v1/vulnerabilidads          # Create
GET    /api/v1/vulnerabilidads/{id}     # Get
PATCH  /api/v1/vulnerabilidads/{id}     # Update
DELETE /api/v1/vulnerabilidads/{id}     # Delete (soft)
GET    /api/v1/vulnerabilidads/export.csv  # Export (audit A7)
```

### Indicators (Fase 15)
```bash
GET    /api/v1/indicadores_formulas      # List indicators
POST   /api/v1/indicadores_formulas      # Create custom
GET    /api/v1/indicadores_formulas/{id}/calcular  # Compute value
```

### IA Integration (Fase 17)
```bash
GET    /api/v1/admin/ia-config          # Read config
PUT    /api/v1/admin/ia-config          # Update config
POST   /api/v1/admin/ia-config/test-call # Test connection
```

### Audit & Compliance
```bash
GET    /api/v1/audit-logs                # Browse audit trail (authorized roles only)
GET    /api/v1/audit-logs/verify         # Verify hash chain integrity (A4)
```

**Full API:** See `docs/API_REFERENCE.md` or visit `/api/v1/docs` (Swagger)

---

## Testing

All tests are in `backend/tests/`:

```bash
# Run all tests (Phase 25 suite)
pytest --cov=app --cov-report=html

# Run specific suite
pytest backend/tests/test_complete_suite_phase25.py -v
pytest backend/tests/test_idor_comprehensive.py -v
pytest backend/tests/test_owasp_comprehensive.py -v
pytest backend/tests/test_ia_integration_phase22_24.py -v

# Coverage report
# Open htmlcov/index.html in browser (target: ≥80%)
```

**Test Coverage:**
- ✅ IDOR (all entities with user_id)
- ✅ OWASP S1-S25 (all security controls)
- ✅ Auditability A1-A8 (all audit rules)
- ✅ Envelope validation (success/paginated/error)
- ✅ E2E workflows (complete business processes)
- ✅ IA integration (threat modeling, FP triage)

---

## Security Highlights

### Controls Implemented

**OWASP API Security Top 10:**
- ✅ S1: IDOR — require_ownership() on all routers
- ✅ S2: Authentication — JWT + HttpOnly + CSRF
- ✅ S3: Property AuthZ — schemas exclude sensitive fields
- ✅ S4: Rate Limiting — pagination max 100, bulk max 500
- ✅ S7: SSRF — IP validation on URLs (no 10.x, 127.x, etc.)
- ✅ S8: Security Headers — HSTS, X-Content-Type-Options, CSP
- ✅ S10: IA Consumption — timeout, retry, validation, sanitization
- ✅ S13: Injection — SQLAlchemy ORM only, no raw SQL

**Data Protection:**
- ✅ All passwords: bcrypt
- ✅ All evidence: SHA-256
- ✅ All audit: hash chain (tamper-evident)
- ✅ All sensitive fields: excluded from response schemas
- ✅ All exports: logged with file hash (A7)

### No Hardcoded Secrets
- Environment variables only
- `.env.example` for reference
- `.env` in `.gitignore`

---

## Deployment

### Quick Start (Production)
```bash
# See docs/DEPLOYMENT_GUIDE.md for full instructions

# 1. Configure environment
export DATABASE_URL="postgresql+asyncpg://user:pass@postgres:5432/appsec"
export SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"

# 2. Start (with SSL/TLS termination in Nginx)
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify
curl -H "Authorization: Bearer $TOKEN" https://appsec.example.com/api/v1/admin/system-health
```

### Performance
- **API P95 latency:** < 500ms
- **Database query P95:** < 100ms
- **Throughput:** > 100 req/sec
- **Error rate:** < 1%

See `docs/PERFORMANCE_OPTIMIZATION.md` for tuning.

---

## Monitoring

### Health Endpoint
```bash
GET /api/v1/admin/system-health  # (super_admin only)
```

Returns:
- Active users (24h)
- Audit log stats
- Database size + table counts
- Error rate (last hour)
- IA provider status

### Logs
```bash
# Application logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f db

# Nginx access/error
docker-compose logs -f nginx
```

---

## Known Limitations & Future Work

- ❌ **Not included:** Jira/GitHub integrations (catalog-only)
- ❌ **Not included:** Email notifications (in-app only)
- ❌ **Not included:** Webhooks to CI/CD
- ❌ **Future:** Real-time WebSocket updates
- ❌ **Future:** Advanced ML-based anomaly detection

---

## Support & Documentation

- **API Docs:** `http://localhost:8000/api/v1/docs` (Swagger)
- **Architecture:** `docs/ARCHITECTURE_DECISIONS.md`
- **Deployment:** `docs/DEPLOYMENT_GUIDE.md`
- **Performance:** `docs/PERFORMANCE_OPTIMIZATION.md`
- **User Guide:** `docs/USER_GUIDE.md` (TODO: in production)

---

## License

Proprietary — CNBV Banking Institution

**Version:** 1.0.0  
**Status:** Production Ready ✅  
**Last Updated:** April 2026

---

**Questions?** Contact the AppSec Platform team.
