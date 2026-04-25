# AppSec Platform — Deployment Guide

## Production Deployment Checklist

### Pre-Deployment Verification

- [ ] All tests pass with coverage ≥80%
- [ ] Code review completed
- [ ] Database migrations verified (Alembic)
- [ ] Environment variables configured (see `.env.example`)
- [ ] Security headers configured in Nginx
- [ ] HTTPS/TLS enabled
- [ ] Database backups configured

### Environment Configuration

Create `.env` file with:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/appsec_prod
DATABASE_TEST_URL=postgresql+asyncpg://user:password@host:5432/appsec_test

# Security
SECRET_KEY=<generate-with-: python -c "import secrets; print(secrets.token_urlsafe(32))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["https://appsec.example.com"]

# Auth
AUTH_MIN_PASSWORD_LENGTH=12
AUTH_ACCOUNT_LOCKOUT_ATTEMPTS=5
AUTH_LOGIN_RATE_LIMIT_PER_MINUTE=10

# AI Provider (default: Ollama local)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
AI_MODEL=llama3.1:8b

# Optional: Paid providers
# ANTHROPIC_API_KEY=<key>
# OPENAI_API_KEY=<key>
# OPENROUTER_API_KEY=<key>

# Debug
DEBUG=false
LOG_LEVEL=INFO

# Audit
AUDIT_LOG_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=730
```

### Docker Compose Deployment

```bash
# Build images
docker-compose build

# Start services (db, backend, frontend)
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# Seed default data
docker-compose exec backend python scripts/seed.py

# Verify health
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/admin/system-health
```

### Database Initialization

```bash
# Create fresh database
docker-compose exec db psql -U postgres -c "CREATE DATABASE appsec_prod;"

# Run migrations
docker-compose exec backend alembic upgrade head

# Seed base data
docker-compose exec backend python -c "from app.seeds import run; run()"
```

### Post-Deployment Checks

1. **API Health**
   ```bash
   curl http://localhost:8000/api/v1/
   ```

2. **Authentication**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "password"}'
   ```

3. **Audit Trail**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/v1/audit-logs
   ```

4. **IA Integration**
   ```bash
   curl -X GET http://localhost:8000/api/v1/admin/ia-config \
     -H "Authorization: Bearer $TOKEN"
   ```

5. **Dashboard**
   Open https://appsec.example.com in browser

### Monitoring & Alerting

**Key Metrics to Monitor:**
- API response time (P95 < 500ms)
- Error rate (< 1%)
- Database connection pool usage
- Disk space (PostgreSQL)
- Audit log growth rate

**Alerting Rules:**
- CPU usage > 80% for 5+ minutes
- Memory usage > 85%
- Database size growth > 10GB/day
- Audit log entries with status='failure' > 100/hour

### Backup Strategy

**Daily Backups:**
```bash
docker-compose exec db pg_dump -U postgres appsec_prod | \
  gzip > /backups/appsec_prod_$(date +%Y%m%d).sql.gz
```

**Retention:** 30 days local, 90 days archived

**Restore:**
```bash
gunzip < backup.sql.gz | docker-compose exec -T db psql -U postgres appsec_prod
```

### Rollback Procedure

If deployment fails:

1. Revert to previous Docker image
2. Run previous Alembic migration: `alembic downgrade -1`
3. Restart services: `docker-compose restart`

### Security Hardening

- [ ] SSL/TLS certificates installed (Let's Encrypt)
- [ ] HTTP → HTTPS redirect configured
- [ ] Security headers in place (see `nginx.conf`)
- [ ] Database credentials in secrets management (not .env)
- [ ] API rate limiting enabled
- [ ] CORS whitelist configured
- [ ] SQL injection protections active (SQLAlchemy ORM)
- [ ] CSRF double-submit tokens enabled

### Performance Tuning

**PostgreSQL:**
```sql
-- Analyze index usage
EXPLAIN ANALYZE SELECT * FROM vulnerabilidads WHERE user_id = '...';

-- Create indexes on frequently filtered columns
CREATE INDEX idx_vulnerabilidades_user_id ON vulnerabilidads(user_id);
CREATE INDEX idx_audit_logs_ts ON audit_logs(ts DESC);
```

**API:**
- Enable compression: `gzip on` in Nginx
- Connection pooling: 10-20 connections per worker
- Pagination default: 50, max: 100

### Logging & Troubleshooting

**View logs:**
```bash
docker-compose logs -f backend
docker-compose logs -f db
```

**Common Issues:**

| Issue | Solution |
|-------|----------|
| Database connection refused | Check DATABASE_URL, verify db container running |
| IA provider timeout | Increase timeout_segundos in system settings |
| High memory usage | Check Alembic migration bloat, run VACUUM |
| Slow API response | Check database query performance with EXPLAIN ANALYZE |

---

**Last Updated:** April 2026
**Version:** 1.0.0
