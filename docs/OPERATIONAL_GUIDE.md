# AppSec Platform — Operational Guide

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                 │
│  ├─ /dashboards - 9 business dashboards            │
│  ├─ /vulnerabilities - CRUD operations             │
│  ├─ /admin - configuration panel                   │
│  └─ /audit - audit log viewer                      │
└────────────────────────┬────────────────────────────┘
                         │ HTTP/HTTPS
┌────────────────────────▼────────────────────────────┐
│                   Nginx Proxy                        │
│  ├─ SSL/TLS termination                            │
│  ├─ Rate limiting                                  │
│  ├─ Compression                                    │
│  └─ Security headers                               │
└────────────────────────┬────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────┐
│              Backend API (FastAPI)                   │
│  ├─ /api/v1/vulnerabilities - Core resource       │
│  ├─ /api/v1/programs - Program management         │
│  ├─ /api/v1/releases - Release workflow           │
│  ├─ /api/v1/admin - Admin endpoints               │
│  ├─ /api/v1/audit-logs - Audit trail              │
│  ├─ /health - Health check                        │
│  └─ /metrics - Prometheus metrics                 │
└────────────────────────┬────────────────────────────┘
     ┌──────────────────┼──────────────────┐
     │                  │                  │
┌────▼─────┐  ┌────────▼─────┐  ┌────────▼─────┐
│PostgreSQL│  │    Redis     │  │     IA      │
│  (Main   │  │   (Cache)    │  │  Provider   │
│   DB)    │  │              │  │ (Ollama/    │
│          │  │              │  │  Anthropic) │
└──────────┘  └──────────────┘  └─────────────┘
```

---

## Startup & Shutdown

### Normal Startup
```bash
cd /path/to/appsec-platform

# Start all services (backend, frontend, database, redis)
docker-compose up -d

# Verify all services running
docker-compose ps

# Expected output:
# STATUS: Up X minutes (for all services)
```

### Verify Services are Healthy
```bash
# Backend API
curl -s http://localhost:8000/health | jq '.status'
# Expected: "healthy"

# Frontend
curl -s http://localhost:3000 | head -20
# Expected: HTML response (no errors)

# Database
docker-compose exec db pg_isready
# Expected: "accepting connections"

# Redis
docker-compose exec redis redis-cli ping
# Expected: "PONG"
```

### Graceful Shutdown
```bash
# Stop all services (preserves data)
docker-compose stop

# Or with timeout (waits 30s for graceful shutdown)
docker-compose stop -t 30

# Verify all stopped
docker-compose ps
# Expected: All containers showing "Exited"
```

### Full Restart (Clears Cache)
```bash
# Stop and remove containers (but keep volumes)
docker-compose down

# Restart
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head
```

---

## Common Troubleshooting

### Issue: Backend Won't Start

**Symptoms:** 
- `docker-compose logs backend` shows error
- Health check fails

**Solution:**
```bash
# 1. Check logs
docker-compose logs -f backend | grep -i error

# 2. Common issues:
# - Port 8000 already in use
docker-compose stop && docker-compose up -d backend

# - Database not ready yet
docker-compose logs db | grep -i "ready"

# - Migration failed
docker-compose exec backend alembic current
docker-compose exec backend alembic history

# - Environment variables missing
cat .env | grep -E "DATABASE|SECRET_KEY"
```

### Issue: Slow API Responses

**Symptoms:**
- Requests taking > 500ms
- Timeouts on dashboards
- Pagination slow

**Diagnosis:**
```bash
# Check database query performance
docker-compose exec db psql -U postgres appsec -c \
  "SELECT query, mean_exec_time FROM pg_stat_statements \
   WHERE mean_exec_time > 500 ORDER BY mean_exec_time DESC LIMIT 10;"

# Check API latency
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/v1/vulnerabilities?page_size=10

# Monitor active connections
docker-compose exec db psql -U postgres appsec -c \
  "SELECT pid, query, query_start FROM pg_stat_activity WHERE state != 'idle';"
```

**Solutions:**
1. **N+1 Query Problem:**
   - Add `selectinload()` or `joinedload()` in service
   - Query should fetch relationships eagerly

2. **Missing Index:**
   - Check PostgreSQL `pg_stat_user_indexes`
   - Create missing indexes: `CREATE INDEX idx_vulnerabilities_estado ON vulnerabilities(estado);`

3. **Connection Pool Exhausted:**
   - Increase in `backend/app/core/database.py`: `pool_size=30`
   - Restart backend: `docker-compose restart backend`

4. **Cache Miss:**
   - Check Redis: `docker-compose exec redis redis-cli info stats`
   - Ensure high-cost queries cached (indicators, dashboards)

### Issue: IA Provider Connection Failed

**Symptoms:**
- POST requests to `/ia/suggest` return error
- IA config shows "test_status: error"
- Threat modeling/FP triage fails

**Troubleshooting:**
```bash
# 1. Check which provider is configured
docker-compose exec backend python -c \
  "from app.core.config import settings; print(settings.AI_PROVIDER)"

# 2. For Ollama (local):
docker ps | grep ollama
# If not running, start Ollama: ollama serve
curl http://localhost:11434/api/tags
# Should return: {"models": [{"name": "llama3.1:8b", ...}]}

# 3. For Anthropic (API):
echo $ANTHROPIC_API_KEY | head -c 20
# Key should start with: sk-ant-

# 4. Test connection from backend
docker-compose exec backend python << 'EOF'
from app.services.ia_provider import OllamaProvider
provider = OllamaProvider()
result = await provider.health_check()
print("Status:", result['status'])
EOF

# 5. Check logs
docker-compose logs backend | grep -i "ollama\|anthropic\|api"
```

**Solutions:**
- **Ollama not running:** Start Ollama on host, ensure `OLLAMA_BASE_URL=http://host.docker.internal:11434`
- **API key invalid:** Regenerate and update `.env`, restart backend
- **Network timeout:** Check firewall rules, increase timeout in settings
- **Model not available:** For Ollama, run `ollama pull llama3.1:8b`

### Issue: Database Disk Space Critical

**Symptoms:**
- `docker-compose logs db` shows "no space left"
- New queries fail with "ERROR: could not write block"

**Diagnosis:**
```bash
# Check disk usage
docker-compose exec db du -sh /var/lib/postgresql

# Check table sizes
docker-compose exec db psql -U postgres appsec -c \
  "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) \
   FROM pg_tables ORDER BY pg_total_relation_size DESC LIMIT 10;"
```

**Solutions:**
1. **VACUUM & ANALYZE (Clean up dead rows):**
   ```bash
   docker-compose exec db psql -U postgres appsec -c "VACUUM ANALYZE;"
   # Typical reduction: 10-30% if many deletes
   ```

2. **Partition Audit Logs (if > 1M rows):**
   ```bash
   docker-compose exec backend python scripts/partition_audit_logs.py
   ```

3. **Increase Volume Size:**
   ```bash
   # In docker-compose.yml:
   # Change:
   # db:
   #   volumes:
   #     - postgres_data:/var/lib/postgresql/data:500GB
   # Then:
   docker-compose down
   # Resize Docker volume if using managed storage
   docker-compose up -d
   ```

### Issue: High Memory Usage

**Symptoms:**
- Backend container killed with "OOMKilled"
- Memory grows over hours
- Slow response after days

**Diagnosis:**
```bash
# Check memory usage
docker stats appsec-platform-backend-1 --no-stream

# Check for memory leaks in logs
docker-compose logs backend | grep -i "memory\|leak"

# Monitor in real-time
docker stats
```

**Solutions:**
1. **Restart Backend (Clears Memory):**
   ```bash
   docker-compose restart backend
   # This is safe - no data loss (stateless)
   ```

2. **Increase Memory Limit:**
   ```bash
   # In docker-compose.yml:
   # backend:
   #   deploy:
   #     resources:
   #       limits:
   #         memory: 4G
   docker-compose up -d
   ```

3. **Check for Query Leaks:**
   ```bash
   # Ensure all connections closed in services
   grep -r "conn.close()" backend/app/services/
   # All database calls must close connections via context manager
   ```

### Issue: Audit Log Hash Chain Broken

**Symptoms:**
- POST to `/admin/audit-logs/verify-integrity` returns `hash_chain_valid: false`
- Lists record numbers with broken hashes
- Critical security issue

**Cause:** Database tampering (unauthorized changes)

**Recovery:**
```bash
# 1. Identify tampering point
curl -X GET http://localhost:8000/admin/audit-logs/verify-integrity | jq '.data.tampered_records'

# 2. Backup entire database before recovery
docker-compose exec db pg_dump -Fc -U postgres appsec > /backups/appsec_pre_recovery.dump

# 3. Review audit logs around tampering
docker-compose exec db psql -U postgres appsec -c \
  "SELECT * FROM audit_logs WHERE id BETWEEN [tamper_start] AND [tamper_end];"

# 4. Restore from known-good backup
gunzip < /backups/appsec_[date_before_tampering].sql.gz | \
  docker-compose exec -T db psql -U postgres appsec

# 5. Re-verify
curl -X GET http://localhost:8000/admin/audit-logs/verify-integrity | jq '.data.hash_chain_valid'
# Should return: true

# 6. Notify Chief AppSec immediately - compliance incident
```

---

## Maintenance Tasks

### Daily

```bash
# 1. Verify services running
docker-compose ps

# 2. Check for error logs
docker-compose logs --tail=100 backend | grep -i error
docker-compose logs --tail=100 db | grep -i error

# 3. Monitor disk usage
docker system df
# Alert if used > 80% of capacity

# 4. Health check
curl -s http://localhost:8000/health | jq '.'
# Should return: {"status": "healthy", "timestamp": "...", "checks": {...}}
```

### Weekly

```bash
# 1. Database maintenance
docker-compose exec db psql -U postgres appsec << EOF
-- Analyze index usage
ANALYZE;

-- Reindex if fragmentation > 30%
REINDEX INDEX CONCURRENTLY idx_vulnerabilidad_created_at;

-- Check for unused indexes
SELECT schemaname, tablename, indexname FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexname NOT LIKE 'pg_%';
EOF

# 2. Backup verification
ls -lh /backups/ | tail -5
# Ensure backups running daily

# 3. Check failed jobs
docker-compose logs backend | grep "FAILED\|ERROR" | tail -20

# 4. Review metrics
curl -s http://localhost:8000/metrics | head -50
```

### Monthly

```bash
# 1. Full backup of database
docker-compose exec db pg_dump -Fc -U postgres appsec | \
  gzip > /backups/appsec_$(date +%Y%m%d).sql.gz

# 2. VACUUM ANALYZE (clean up)
docker-compose exec db psql -U postgres appsec -c "VACUUM ANALYZE;"

# 3. Review slow query log
docker-compose exec db psql -U postgres appsec -c \
  "SELECT query, mean_exec_time FROM pg_stat_statements \
   WHERE mean_exec_time > 1000 ORDER BY mean_exec_time DESC LIMIT 10;"

# 4. Rotate old backups (keep 90 days)
find /backups -name "appsec_*.sql.gz" -mtime +90 -delete

# 5. Check disk trends
du -sh /var/lib/docker/volumes/*/
# Alert if growing > 5GB/month
```

---

## Disaster Recovery

### Backup Strategy

**Daily automated backups:**
```bash
# Add to crontab (runs 2am daily)
0 2 * * * docker-compose -f /path/to/docker-compose.yml \
  exec -T db pg_dump -Fc -U postgres appsec | \
  gzip > /backups/appsec_$(date +\%Y\%m\%d).sql.gz
```

**Retention Policy:**
- Local: 30 days (for quick recovery)
- Archive: 90 days (for compliance)
- Encrypted and stored off-site

### Restore from Backup

**Complete Database Restore:**
```bash
# 1. Stop API (prevent writes during restore)
docker-compose stop backend

# 2. Restore from backup
gunzip < /backups/appsec_20260415.sql.gz | \
  docker-compose exec -T db psql -U postgres appsec

# 3. Verify data integrity
docker-compose exec db psql -U postgres appsec -c \
  "SELECT COUNT(*) FROM vulnerabilities;"

# 4. Restart backend
docker-compose up -d backend

# 5. Run migrations (in case schema changed)
docker-compose exec backend alembic upgrade head
```

**Restore Specific Table:**
```bash
# Extract single table from backup
pg_restore --table=vulnerabilities /backups/appsec_20260415.dump | \
  docker-compose exec -T db psql -U postgres appsec

# Or import from SQL backup
gunzip < backup.sql.gz | grep "^COPY vulnerabilities" | \
  docker-compose exec -T db psql -U postgres appsec
```

### Data Loss Incident Response

1. **STOP immediately:** Stop backend to prevent further writes
2. **ASSESS:** Determine what data was lost/corrupted
3. **ISOLATE:** Check audit logs for when change occurred
4. **RESTORE:** Use backup from before incident
5. **VERIFY:** Query restored data for correctness
6. **NOTIFY:** Inform Chief AppSec immediately
7. **DOCUMENT:** Log incident in incident tracker

---

## Monitoring & Alerting

### Key Metrics to Monitor

**API Performance:**
```
Target: P95 response time < 500ms
Alert: If P95 > 1000ms for 5+ minutes
```

**Database:**
```
Target: Active connections < 50
Target: Query time < 100ms (P95)
Alert: If connection pool exhausted
Alert: If disk > 80% capacity
```

**System:**
```
Target: CPU < 70%
Target: Memory < 80%
Target: Disk free > 100GB
Alert: If CPU > 90% for 10+ minutes
```

**Application:**
```
Target: Error rate < 1%
Alert: If > 5% errors for 5+ minutes
Alert: If IA provider down for > 30 min
```

### Prometheus Metrics

Metrics exposed at `/metrics` endpoint:

```
# HTTP Requests
http_requests_total{method="GET",status="200"} 15000
http_request_duration_seconds{method="GET",quantile="0.95"} 0.245

# Database
db_connection_pool_connections_used 12
db_query_duration_seconds{query="select_vulnerabilities"} 0.085

# IA
ia_requests_total{provider="anthropic",status="success"} 450
ia_request_duration_seconds{provider="anthropic"} 2.34
```

### Setting up Alerting

**Option 1: Prometheus + AlertManager**
```yaml
# prometheus.yml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

# alert_rules.yml
groups:
  - name: appsec
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
```

**Option 2: Cloud Monitoring**
- Send metrics to Datadog, New Relic, or CloudWatch
- Set threshold-based alerts
- Alert to Slack/email/PagerDuty

---

## Security Maintenance

### Monthly Security Review

```bash
# 1. Review recent audit logs for suspicious activity
docker-compose exec db psql -U postgres appsec -c \
  "SELECT usuario_id, accion, COUNT(*) as count \
   FROM audit_logs \
   WHERE fecha > NOW() - INTERVAL '30 days' \
   GROUP BY usuario_id, accion \
   ORDER BY count DESC;"

# 2. Check for failed login attempts
docker-compose logs backend | grep "login.*failed" | wc -l
# Alert if > 100 in a day

# 3. Verify no SQL injection attempts
docker-compose logs backend | grep -i "sql\|injection\|execute"

# 4. Check for unauthorized API access
docker-compose logs backend | grep "403\|Forbidden" | tail -50
```

### Update Dependencies

```bash
# Quarterly dependency updates to patch security vulnerabilities
cd backend
pip list --outdated
pip install --upgrade <package>

cd frontend
npm outdated
npm update

# Run security audit
npm audit
pip audit

# Commit updates
git add requirements.txt package.json
git commit -m "Security: Update dependencies"
```

---

## Performance Tuning

### Database Query Performance

```bash
# Enable slow query log
docker-compose exec db psql -U postgres -c \
  "ALTER SYSTEM SET log_min_duration_statement = 500;
   SELECT pg_reload_conf();"

# Find slow queries
docker-compose exec db psql -U postgres appsec -c \
  "SELECT query, mean_exec_time FROM pg_stat_statements \
   WHERE mean_exec_time > 500 ORDER BY mean_exec_time DESC LIMIT 10;"

# Explain slow query
docker-compose exec db psql -U postgres appsec -c \
  "EXPLAIN ANALYZE SELECT * FROM vulnerabilities \
   WHERE severidad = 'CRITICAL' AND estado = 'OPEN';"
```

### Cache Optimization

```bash
# Check Redis memory usage
docker-compose exec redis redis-cli info memory

# Monitor cache hit rate
docker-compose exec redis redis-cli info stats | grep -E "keyspace|hits|misses"
# Target: > 80% hit rate

# Clear cache (if needed)
docker-compose exec redis redis-cli FLUSHALL
```

---

## Logs & Debugging

### View Logs

```bash
# Backend logs (last 100 lines)
docker-compose logs -f backend --tail=100

# Database logs
docker-compose logs -f db --tail=100

# Frontend logs
docker-compose logs -f frontend --tail=100

# Follow all logs
docker-compose logs -f

# Filter logs
docker-compose logs backend | grep ERROR
docker-compose logs backend | grep "request_id=xyz"
```

### Debug Mode

```bash
# Enable debug logging (temporary)
docker-compose exec backend python -c \
  "import logging; logging.basicConfig(level=logging.DEBUG)"

# Check debug setting in .env
grep DEBUG .env
# Set: DEBUG=true (only for development!)

# Restart backend with debug
docker-compose restart backend
```

---

## Módulo Temas Emergentes

### Propósito operativo

El módulo gestiona cualquier situación no planificada (vulnerabilidades 0-day, alertas regulatorias, solicitudes urgentes) que requiere seguimiento estructurado hasta su cierre. Complementa los programas formales (SAST/DAST/etc.) cubriendo lo que no encaja en un programa regular.

### Flujo de estados

```
Identificado ──► En Seguimiento ──► En Resolución ──► Cerrado
     │                                                    ▲
     └──── (si se descarta) ─────────────────────────────┘
```

Los estados son configurables en Admin → Flujos de Estatus → módulo `tema_emergente`.

### Procedimiento de revisión semanal

**Responsable:** Chief AppSec o Program Leader designado  
**Frecuencia:** Cada lunes antes de las 10:00

1. Abrir Dashboard → Temas Emergentes
2. Revisar KPI "Sin Movimiento" — temas que no han cambiado en 7+ días
3. Para cada tema sin movimiento:
   - Verificar si el responsable tiene contexto actualizado
   - Si hay avance: pedirle que registre una entrada de bitácora
   - Si no hay avance en 14+ días: ver criterios de escalación abajo
4. Revisar temas de Alto Impacto — asegurarse de que tienen al menos una entrada de bitácora en los últimos 3 días

### Criterios de escalación por impacto

| Impacto | Sin movimiento por | Acción |
|---------|-------------------|--------|
| **Alto** | 24 horas | Notificación directa al responsable; Chief AppSec en copia |
| **Alto** | 48 horas sin respuesta | Escalar a Chief AppSec para revisión inmediata |
| **Medio** | 72 horas | Solicitar actualización de bitácora |
| **Medio** | 7 días | Escalar a Program Leader |
| **Bajo** | 7 días | Agregar a agenda de reunión semanal |
| **Bajo** | 14 días | Evaluar si el tema debe cerrarse o reclasificarse |

### Proceso de cierre

Un tema debe cerrarse formalmente cuando:
- La situación fue resuelta o mitigada
- Se determinó que no aplica o fue un falso positivo
- Se integró a un programa formal de seguridad

**Para cerrar:**
1. Agregar entrada final de bitácora documentando la resolución
2. Cambiar estado a "Cerrado"
3. Registrar cierre con conclusión y recomendaciones vía `POST /api/v1/cierre-conclusion`
4. El cierre queda en el audit log permanente

---

**Last Updated:** April 2026
**Version:** 1.1.0
