# AppSec Platform — Security Checklist

## OWASP API Security Top 10 (2023) — Compliance Status

### S1: Broken Object Level Authorization (IDOR)

**Status:** ✅ IMPLEMENTED

**Verification:**
```bash
# 1. Test IDOR protection on user-owned resources
curl -H "Authorization: Bearer USER_A_TOKEN" \
  http://localhost:8000/api/v1/vulnerabilities/USER_B_VULN_ID
# Expected: 403 Forbidden

# 2. Verify require_ownership() used in all routers
grep -r "require_ownership" backend/app/api/v1/

# 3. IDOR tests in test suite
pytest tests/test_vulnerabilities.py::test_cannot_access_other_user_vulnerability -v
```

**Remediation:**
- Service: `VulnerabilidadService` validates `user_id` match
- Router: `require_ownership()` dependency injected
- Test: IDOR test per entity with ownership check

---

### S2: Broken Authentication

**Status:** ✅ IMPLEMENTED

**Features:**
- ✅ HttpOnly cookies (no JavaScript access)
- ✅ CSRF double-submit token validation
- ✅ Token rotation with family tracking
- ✅ Account lockout (after 5 failed attempts)
- ✅ Rate limiting (10 login attempts/minute)
- ✅ Secure refresh token handling

**Verification:**
```bash
# 1. Test login rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:8000/api/v1/auth/login \
    -d '{"username": "user", "password": "wrong"}' 2>/dev/null
done
# Expected: 429 Too Many Requests after 10 attempts

# 2. Test account lockout
# After 5 failed attempts on valid user, login blocked for 15 minutes

# 3. Test CSRF protection
curl -X POST http://localhost:8000/api/v1/vulnerabilities \
  -H "Content-Type: application/json" \
  -d '{}' -H "X-CSRF-Token: invalid"
# Expected: 403 Forbidden (CSRF validation failed)

# 4. Test token rotation
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Authorization: Bearer REFRESH_TOKEN"
# Expected: New access token + refresh token with same family
```

**Configuration:**
```bash
# In .env (adjustable for security levels)
AUTH_MIN_PASSWORD_LENGTH=12
AUTH_ACCOUNT_LOCKOUT_ATTEMPTS=5
AUTH_LOGIN_RATE_LIMIT_PER_MINUTE=10
CSRF_PROTECTION_ENABLED=true
REFRESH_TOKEN_FAMILY_TRACKING=true
```

---

### S3: Broken Object Property Level Authorization

**Status:** ✅ IMPLEMENTED

**Verification:**
```bash
# 1. Check response schemas exclude sensitive fields
grep -r "exclude_fields\|response_only" backend/app/schemas/

# 2. Test sensitive field exclusion
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/v1/users
# Response should NOT include: hashed_password, refresh_tokens, internal_flags

# 3. Verify Pydantic ConfigDict restricts fields
grep -A5 "class.*Response" backend/app/schemas/user.py | grep -E "exclude|fields"
```

**Implementation:**
```python
# In schema definitions:
class VulnerabilidadResponse(BaseModel):
    id: str
    titulo: str
    severidad: str
    # NOT included: internal_notes, debug_info
    
    class Config:
        from_attributes = True
        # Explicitly list allowed fields only
```

---

### S4: Unrestricted Resource Consumption

**Status:** ✅ IMPLEMENTED

**Protections:**
- ✅ Pagination mandatory (max 100 items/page)
- ✅ Rate limiting (1000 requests/min global)
- ✅ CSV import limited (10/hour per user)
- ✅ Bulk operations capped (500 vulnerabilities max)
- ✅ Upload size limited (10MB default)
- ✅ IA timeout enforced (30s default)

**Verification:**
```bash
# 1. Test pagination enforcement
curl http://localhost:8000/api/v1/vulnerabilities?page_size=500
# Expected: 400 Bad Request - page_size exceeds max 100

# 2. Test rate limiting
for i in {1..1050}; do
  curl -s http://localhost:8000/api/v1/vulnerabilities -o /dev/null &
done
wait
# Expected: 429 Too Many Requests after 1000 requests

# 3. Test bulk operation limits
curl -X POST http://localhost:8000/api/v1/vulnerabilities/bulk/assign \
  -H "Content-Type: application/json" \
  -d '{"vulnerability_ids": [/* 501 UUIDs */], "asignado_a_id": "..."}'
# Expected: 400 Bad Request - exceeds 500 max

# 4. Test IA timeout
# Set AI_TIMEOUT_SECONDS=1 in .env, restart
curl -X POST http://localhost:8000/api/v1/sesiones/1/ia/suggest
# Expected: 504 Gateway Timeout after 1 second
```

**Configuration:**
```bash
# In .env
PAGINATION_DEFAULT_PAGE_SIZE=50
PAGINATION_MAX_PAGE_SIZE=100
RATE_LIMIT_REQUESTS_PER_MINUTE=1000
RATE_LIMIT_LOGIN_ATTEMPTS_PER_MINUTE=10
CSV_IMPORT_LIMIT_PER_HOUR=10
CSV_IMPORT_LIMIT_PER_USER=10
BULK_OPERATION_MAX=500
UPLOAD_MAX_SIZE_MB=10
AI_TIMEOUT_SECONDS=30
```

---

### S5: Broken Function Level Authorization

**Status:** ✅ IMPLEMENTED

**Verification:**
```bash
# 1. Test role-based access control
# As analyst, try to access super_admin endpoint
curl -H "Authorization: Bearer ANALYST_TOKEN" \
  http://localhost:8000/api/v1/admin/system-configuration
# Expected: 403 Forbidden

# 2. Verify require_role() in admin endpoints
grep -r "require_role.*super_admin" backend/app/api/v1/admin/

# 3. Test permission matrix
pytest tests/test_rbac.py -v
```

**Roles & Permissions:**
```
super_admin:
  - All endpoints unrestricted
  - Can manage users and roles
  - Can configure system

chief_appsec:
  - Read: All vulnerabilities, programs, releases
  - Approve: Risk exceptions, releases, threat modeling
  - Report: Access executive dashboards

lider_programa:
  - Manage: Assigned programs
  - Create: Program activities, findings
  - Report: Program metrics

analista:
  - Create/Update: Vulnerabilities, findings
  - Assign: Vulnerabilities to users
  - Triage: False positives (with IA)
  - Report: Limited dashboards

auditor:
  - Read-only: All audit logs
  - Cannot modify any data
  - Report: Compliance reports

readonly:
  - View: Executive dashboards only
```

---

### S6: Unrestricted Access to Sensitive Business Flows

**Status:** ✅ IMPLEMENTED

**Rate Limits on Sensitive Operations:**
```python
# CSV Import: 10/hour
# Bulk Operations: 100/hour
# Exports: 50/hour
# IA Calls: 100/hour per provider

# Monitoring for abuse patterns:
# - 10 CSV imports in 30 minutes → alert
# - 50 exports in 1 hour → alert
# - 100+ SoD approvals in 1 hour → alert
```

**Segregation of Duties (SoD):**
```bash
# Verify SoD enforcement
curl -X PATCH http://localhost:8000/api/v1/service-releases/1/approval \
  -H "Authorization: Bearer SAME_USER_TOKEN"
# Expected: 403 Forbidden - "Cannot approve own request"

# If SoD rule disabled:
curl -X GET http://localhost:8000/api/v1/admin/regla-sod/approve_release
# Should show: {"enabled": true, "rules": [...]}
```

**Verification:**
```bash
# Review SoD configuration
docker-compose exec db psql -U postgres appsec -c \
  "SELECT accion, requiere_aprobacion, valida_sod FROM reglas_sod;"
```

---

### S7: Server Side Request Forgery (SSRF)

**Status:** ✅ IMPLEMENTED

**URL Validation:**
```bash
# 1. Test SSRF protection on web assets
curl -X POST http://localhost:8000/api/v1/activos-web \
  -H "Content-Type: application/json" \
  -d '{"url": "http://169.254.169.254/metadata"}'
# Expected: 400 Bad Request - "Invalid URL (metadata service)"

# 2. Test private IP blocking
curl -X POST http://localhost:8000/api/v1/activos-web \
  -d '{"url": "http://192.168.1.1/admin"}'
# Expected: 400 Bad Request - "Private IP not allowed"

# 3. Test localhost blocking
curl -X POST http://localhost:8000/api/v1/activos-web \
  -d '{"url": "http://localhost:8080/internal"}'
# Expected: 400 Bad Request - "Localhost not allowed"
```

**Allowed Schemes:**
```python
# Only http/https permitted
# No file://, gopher://, dict://, etc.

ALLOWED_URL_SCHEMES = ['http', 'https']
BLOCKED_IPS = [
    '169.254.169.254',      # AWS metadata
    '10.0.0.0/8',           # Private
    '192.168.0.0/16',       # Private
    '172.16.0.0/12',        # Private
    '127.0.0.1',            # Localhost
    '::1',                   # IPv6 localhost
]
```

---

### S8: Security Misconfiguration

**Status:** ✅ IMPLEMENTED

**Security Headers:**
```bash
# Verify security headers
curl -I https://appsec.example.com | grep -E "Strict-Transport|X-Content-Type|X-Frame-Options|Content-Security-Policy"

# Expected output:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
# Referrer-Policy: strict-origin-when-cross-origin
```

**Configuration Checklist:**
- [ ] DEBUG=false in production
- [ ] CORS whitelist configured (not * )
- [ ] SECRET_KEY rotated and strong
- [ ] Database credentials in secrets management
- [ ] TLS 1.2+ enforced
- [ ] HSTS enabled for HTTPS
- [ ] Error messages generic (no stack traces)
- [ ] Logging doesn't expose secrets

**Verification:**
```bash
# 1. Verify debug mode off
docker-compose exec backend python -c "from app.core.config import settings; print(settings.DEBUG)"
# Expected: False

# 2. Verify CORS whitelist
grep "CORS_ORIGINS" .env | head -1

# 3. Test error responses
curl http://localhost:8000/api/v1/vulnerabilities/invalid-uuid
# Expected: {"error": "NOT_FOUND", "message": "Resource not found"}
# NOT: Python traceback or SQL query

# 4. Verify HTTPS redirect
curl -I http://appsec.example.com
# Expected: 301/302 redirect to https://
```

---

### S9: Improper Inventory Management

**Status:** ✅ IMPLEMENTED

**API Versioning:**
```bash
# All endpoints versioned
/api/v1/vulnerabilities
/api/v1/programs
# Future versions can coexist without breaking

# OpenAPI spec always updated
curl http://localhost:8000/openapi.json | jq '.info.version'
# Should match application version in pyproject.toml
```

**Deprecated Endpoints:**
```bash
# No deprecated endpoints without warning header
# If endpoint deprecated:
# 1. Add warning header: X-Deprecated: true
# 2. Set sunset date: X-Sunset: Mon, 31 Dec 2025 23:59:59 GMT
# 3. Provide migration path in docs
```

---

### S10: Unsafe Consumption of APIs

**Status:** ✅ IMPLEMENTED

**IA Provider Protection:**
```bash
# 1. Test timeout enforcement
# Set AI_TIMEOUT_SECONDS=1, trigger IA request
curl -X POST http://localhost:8000/api/v1/sesiones/1/ia/suggest
# Expected: 504 Gateway Timeout after 1 second

# 2. Test response validation
# Mock invalid JSON response
# Should fail with "Invalid response from IA provider"

# 3. Test data sanitization
curl -X POST http://localhost:8000/api/v1/vulnerabilidades/1/ia/classify-fp \
  -d '{"code_snippet": "api_key = \"sk-secret-12345\"..."}'
# Logs should show: "api_key = \"[REDACTED]\""
# Not: Actual API key in logs

# 4. Test output escaping
# IA returns HTML-like content
# Should be escaped before rendering
```

**Implementation:**
```python
# timeout: 30 seconds (configurable)
# retry: exponential backoff (3 max)
# validation: Pydantic response models
# sanitization: Regex patterns remove secrets before sending
```

---

## OWASP Top 10 Web (2021)

### S11: Broken Access Control

**Status:** ✅ IMPLEMENTED

**Verification:**
```bash
# 1. UI-level permission checks
# As analyst, "Guardar Configuración" button should be disabled

# 2. Backend enforcement (always)
curl -X PUT http://localhost:8000/api/v1/admin/system-configuration \
  -H "Authorization: Bearer ANALYST_TOKEN"
# Expected: 403 Forbidden - always enforced regardless of UI

# 3. Feature-level permissions
pytest tests/test_features.py -v
```

---

### S13: Injection

**Status:** ✅ IMPLEMENTED

**SQL Injection Prevention:**
```bash
# 1. Verify no raw SQL queries
grep -r "execute.*SELECT\|execute.*INSERT" backend/app/

# 2. Test SQL injection resistance
curl -X GET "http://localhost:8000/api/v1/vulnerabilities?buscar=';DROP TABLE vulnerabilities;--"
# Expected: Safe (parameterized query used)

# 3. ORM validation
# All queries use SQLAlchemy ORM (no raw SQL)
```

**CSV Injection Prevention:**
```bash
# Ensure CSV export escapes formulas
# If CSV contains: =1+1, it should be exported as: =1+1 (not executed)
```

**XSS Prevention (Frontend):**
```bash
# 1. No dangerouslySetInnerHTML with user data
grep -r "dangerouslySetInnerHTML" frontend/src/

# 2. Sanitize rich text
# Use DOMPurify or equivalent for WYSIWYG editors

# 3. Content Security Policy blocks inline scripts
```

---

### S14: Insecure Design

**Status:** ✅ IMPLEMENTED

**Threat Modeling Documentation:**
- See: `/docs/adr/` directory
- Each major feature has Architecture Decision Record (ADR)
- Threat modeling performed before implementation

**ADR Examples:**
- `001_authentication_strategy.md` - Why HttpOnly cookies
- `002_audit_logging.md` - Hash chain design
- `003_aia_integration.md` - Multi-provider support

---

### S17: Identification and Authentication Failures

**Status:** ✅ IMPLEMENTED (Relaxed for Development)

**Current Configuration (Development):**
```bash
AUTH_MIN_PASSWORD_LENGTH=8  # Relaxed for testing
AUTH_ACCOUNT_LOCKOUT_ATTEMPTS=5
AUTH_LOGIN_RATE_LIMIT_PER_MINUTE=10
```

**Production Hardening (Before Go-Live):**
```bash
# Update .env for production:
AUTH_MIN_PASSWORD_LENGTH=12
AUTH_ACCOUNT_LOCKOUT_ATTEMPTS=3
AUTH_LOGIN_RATE_LIMIT_PER_MINUTE=5
AUTH_SESSION_TIMEOUT_MINUTES=15
AUTH_REFRESH_TOKEN_ROTATION=true
AUTH_REQUIRE_MFA=false  # Optional: MFA for super_admin
```

**Verification Before Production:**
```bash
# 1. Test password policy
curl -X POST http://localhost:8000/api/v1/auth/register \
  -d '{"username": "test", "password": "short"}'
# Expected: 400 Bad Request - password too short (for production: < 12 chars)

# 2. Test session timeout
# Set token expiry to 15 minutes
# Verify logout after timeout

# 3. Test refresh token rotation
# Old refresh token should be invalidated after rotation
```

---

### S18: Software and Data Integrity Failures

**Status:** ✅ IMPLEMENTED

**Evidence Integrity:**
```bash
# 1. Test hash calculation
# Upload file, check SHA-256 stored
curl -F "file=@evidence.pdf" \
  http://localhost:8000/api/v1/auditorias/1/evidencias
# Response should include: "hash_sha256": "abc123..."

# 2. Verify hash match
curl http://localhost:8000/api/v1/auditorias/1/evidencias/file_id
# Check Content-Hash header matches stored hash

# 3. Test integrity on download
curl -I http://localhost:8000/api/v1/auditorias/1/evidencias/file_id/download
# Should include: Content-Hash: sha256=abc123...
```

**Audit Log Integrity:**
```bash
# 1. Verify hash chain
curl -X GET http://localhost:8000/api/v1/admin/audit-logs/verify-integrity
# Response: {"hash_chain_valid": true, "tampered_records": 0}

# 2. Test chain detection
# If record manually modified in DB, chain breaks
# Next verification fails with specific record numbers
```

---

### S19: Security Logging and Monitoring Failures

**Status:** ✅ IMPLEMENTED

**Audit Logging:**
```bash
# 1. Verify all critical actions logged
grep -r "audit_action_prefix" backend/app/services/ | wc -l
# Expected: 45+ services with audit logging

# 2. Check audit log entries
docker-compose exec db psql -U postgres appsec -c \
  "SELECT accion, COUNT(*) FROM audit_logs GROUP BY accion;"

# 3. Verify no sensitive data logged
grep -E "password|secret|token|api_key" /var/log/appsec/*.log
# Expected: No sensitive data (should be redacted)
```

**Anomaly Detection:**
- N failed login attempts → Alert
- Bulk export pattern → Alert
- Config changes in cascade → Alert
- High error rate → Alert

**Verification:**
```bash
# Trigger anomaly detection
for i in {1..15}; do
  curl -X POST http://localhost:8000/api/v1/auth/login \
    -d '{"username": "user", "password": "wrong"}' 2>/dev/null &
done
wait
# Check super_admin dashboard for alert
```

---

## CNBV Compliance

### KRI0025: Control Deficiency Rate

**Metric:** % Controles Deficientes = (Deficient Controls / Total Controls) × 100

**Target:** < 10%

**Calculation:**
```python
total_controls = db.query(Control).filter(Control.obligatorio == true).count()
deficient_controls = db.query(Control) \
  .join(Vulnerabilidad) \
  .filter(Control.obligatorio == true) \
  .filter(Vulnerabilidad.estado == "OPEN") \
  .count()

kri0025 = (deficient_controls / total_controls) * 100
```

**Dashboard:**
```bash
# Navigate to: Dashboards → CNBV
# View: KRI0025 percentage + trend
# Export: CSV with supporting vulnerabilities
```

**Remediation:**
- If KRI0025 > 10%: Prioritize remediation
- If > 15%: Escalate to governance
- Weekly review meeting with Chief AppSec

---

## Testing & Validation

### Automated Security Tests

```bash
# Run all security tests
pytest tests/test_security/ -v --tb=short

# Specific test categories:
pytest tests/test_security/test_idor.py          # IDOR prevention
pytest tests/test_security/test_auth.py          # Authentication
pytest tests/test_security/test_rbac.py          # Role-based access
pytest tests/test_security/test_ssrf.py          # SSRF prevention
pytest tests/test_security/test_rate_limit.py    # Rate limiting
```

### Manual Security Review

```bash
# 1. SQL Injection
# Input: `' OR 1=1--`
# Verify: No data leak

# 2. SSRF
# Input: `http://169.254.169.254/metadata`
# Verify: 400 Bad Request

# 3. CSRF
# Omit X-CSRF-Token header on POST
# Verify: 403 Forbidden

# 4. Broken Auth
# Use expired token
# Verify: 401 Unauthorized

# 5. XXE (if XML parsing)
# Input: `<!ENTITY x SYSTEM "file:///etc/passwd">`
# Verify: No file read

# 6. Race Condition
# Concurrent requests to sensitive endpoint
# Verify: Atomic operations (no double-spend, race condition)
```

### Penetration Testing (Before Production)

**Recommended:**
- OWASP ZAP automated scan
- Manual API testing
- Authentication bypass attempts
- Authorization bypass attempts
- SQL injection attempts
- XSS attempts

---

## Pre-Production Checklist

- [ ] All OWASP Top 10 controls implemented
- [ ] CNBV KRI0025 < 10%
- [ ] Audit log integrity verified
- [ ] SSL/TLS configured (TLS 1.2+)
- [ ] Security headers all present
- [ ] Database backups automated
- [ ] Rate limiting active
- [ ] Error handling generic (no stack traces)
- [ ] Secrets in secure storage (not .env)
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented
- [ ] Staff trained on security policies
- [ ] Penetration testing completed
- [ ] Security audit passed

---

**Last Updated:** April 2026
**Version:** 1.0.0
**Maintained By:** Security Team
