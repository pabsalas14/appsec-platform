# Omnisearch Deployment Guide

## Quick Start

### 1. Deploy Migration

```bash
cd backend
alembic upgrade head
```

**Expected Output**:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade ... -> f9g5h1i2j3k4

Upgrading database for omnisearch...
- Creating 16 GIN indexes on text fields
- No downtime required
```

### 2. Verify Migration Success

```sql
-- Check that all indexes were created
SELECT 
  indexname, 
  tablename
FROM pg_indexes 
WHERE indexname LIKE 'ix_%_gin%'
ORDER BY tablename;
```

**Expected Results** (16 indexes):
```
                        indexname                    |         tablename
────────────────────────────────────────────────────────────────────────
 ix_auditorias_titulo_gin                            | auditorias
 ix_control_seguridads_nombre_gin                    | control_seguridads
 ix_hallazgo_dasts_descripcion_gin                   | hallazgo_dasts
 ix_hallazgo_dasts_titulo_gin                        | hallazgo_dasts
 ix_hallazgo_masts_descripcion_gin                   | hallazgo_masts
 ix_hallazgo_masts_titulo_gin                        | hallazgo_masts
 ix_hallazgo_sasts_descripcion_gin                   | hallazgo_sasts
 ix_hallazgo_sasts_titulo_gin                        | hallazgo_sasts
 ix_iniciativas_descripcion_gin                      | iniciativas
 ix_iniciativas_titulo_gin                           | iniciativas
 ix_planes_remediacion_acciones_gin                  | planes_remediacion
 ix_planes_remediacion_descripcion_gin               | planes_remediacion
 ix_temas_emergentes_descripcion_gin                 | temas_emergentes
 ix_temas_emergentes_titulo_gin                      | temas_emergentes
 ix_vulnerabilidads_descripcion_gin                  | vulnerabilidads
 ix_vulnerabilidads_titulo_gin                       | vulnerabilidads
```

### 3. Restart Backend Services

```bash
# If using Docker
docker-compose restart api

# Or if running directly
systemctl restart appsec-platform-api
```

### 4. Test the Endpoint

```bash
# Get auth token first
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq -r '.data.access_token')

# Test search endpoint
curl -X GET "http://localhost:8000/api/v1/search?q=sql" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Expected Response**:
```json
{
  "status": "success",
  "data": {
    "query": "sql",
    "results": {
      "Vulnerabilidades": [
        {
          "tipo": "Vulnerabilidad",
          "id": "550e8400...",
          "nombre": "SQL Injection in Login",
          "descripcion": "User input not sanitized...",
          "url": "/vulnerabilidads/550e8400..."
        }
      ]
    }
  }
}
```

## Testing Procedures

### Unit Test: Search Endpoint

**File**: Create `backend/tests/test_search.py`

```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.vulnerabilidad import Vulnerabilidad
from app.api.v1.search import global_search

@pytest.mark.asyncio
async def test_search_vulnerabilities(db: AsyncSession):
    """Test searching vulnerabilities by title."""
    # Create test data
    vuln = Vulnerabilidad(
        user_id=...,
        titulo="SQL Injection Test",
        descripcion="Test description",
        fuente="SAST",
        severidad="Alta",
        estado="Abierto"
    )
    db.add(vuln)
    await db.commit()
    
    # Search
    response = await global_search(
        db=db,
        current_user=...,
        q="SQL"
    )
    
    # Assert
    assert response['status'] == 'success'
    assert 'Vulnerabilidades' in response['data']['results']
    assert len(response['data']['results']['Vulnerabilidades']) == 1
```

### Integration Test: Full Search Flow

```bash
# Start fresh test data
./scripts/seed_test_data.sh

# Run API server
cd backend && python -m uvicorn app.main:app --reload

# Open frontend (in another terminal)
cd frontend && npm run dev

# Test in browser: http://localhost:3000
# 1. Press Ctrl+K
# 2. Type "test" (should return test data)
# 3. Click result to navigate
# 4. Verify URL matches expected path
```

### Performance Test

```bash
# Generate load to verify GIN index performance
ab -n 1000 -c 10 "http://localhost:8000/api/v1/search?q=test&Authorization: Bearer <TOKEN>"
```

**Expected Performance**:
- Mean response time: < 100ms
- 95th percentile: < 200ms
- With GIN indexes: 5-10x faster than without

### Verify Index Usage

```sql
-- Check that queries are actually using the GIN indexes
EXPLAIN ANALYZE
SELECT * FROM vulnerabilidads 
WHERE titulo ILIKE '%sql%' 
AND deleted_at IS NULL
LIMIT 10;
```

**Expected Plan**:
```
Bitmap Heap Scan on vulnerabilidads
  Recheck Cond: (titulo ~~* '%sql%')
  -> Bitmap Index Scan on ix_vulnerabilidads_titulo_gin
        Index Cond: (titulo ~~* '%sql%')
```

## Troubleshooting

### Problem: "function gin_trgm_ops does not exist"

**Cause**: PostgreSQL pg_trgm extension not installed

**Solution**:
```sql
-- Connect as superuser
sudo -u postgres psql -d appsec_platform
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Then re-run migration:
```bash
alembic downgrade -1
alembic upgrade head
```

### Problem: Search returns no results

**Diagnosis**:
```sql
-- Check if data exists
SELECT COUNT(*) FROM vulnerabilidads WHERE deleted_at IS NULL;

-- Check if index exists
SELECT * FROM pg_stat_user_indexes 
WHERE indexname = 'ix_vulnerabilidads_titulo_gin';
```

**Solutions**:
1. Verify data exists: Insert test record if needed
2. Verify index is used: Run EXPLAIN ANALYZE (see above)
3. Clear query cache: Run `ANALYZE vulnerabilidads;`

### Problem: Slow search queries

**Diagnosis**:
```sql
-- Check index size
SELECT 
  indexname, 
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'ix_%_gin%';

-- Check table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%vulnerabilidad%';
```

**Solutions**:
1. Run VACUUM ANALYZE on bloated tables
2. Check query plan with EXPLAIN ANALYZE
3. Consider index rebuilding:
   ```sql
   REINDEX INDEX CONCURRENTLY ix_vulnerabilidads_titulo_gin;
   ```

### Problem: Frontend SearchCommand not opening

**Diagnosis**:
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify Ctrl+K is not captured by browser (e.g., search engines)

**Solutions**:
1. Verify SearchCommand is mounted in Header
2. Test keyboard event with console:
   ```javascript
   document.addEventListener('keydown', e => {
     if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
       console.log('Ctrl+K detected');
     }
   });
   ```
3. Check that CommandDialog component is properly styled

## Performance Monitoring

### Query Performance Baseline

Before going to production, establish baseline:

```bash
# Run 100 searches and collect timings
./scripts/benchmark_search.sh

# Expected output:
# Mean response time: 45ms
# 95th percentile: 120ms
# 99th percentile: 200ms
```

### Index Maintenance Schedule

**Weekly**:
```sql
-- Update query statistics
ANALYZE vulnerabilidads;
ANALYZE planes_remediacion;
ANALYZE temas_emergentes;
-- ... (all indexed tables)
```

**Monthly**:
```sql
-- Rebuild fragmented indexes
REINDEX TABLE CONCURRENTLY vulnerabilidads;
REINDEX TABLE CONCURRENTLY planes_remediacion;
-- ... (all indexed tables)
```

**Quarterly**:
```sql
-- Full VACUUM to reclaim space
VACUUM FULL vulnerabilidads;
VACUUM FULL planes_remediacion;
-- ... (all indexed tables)
```

## Rollback Plan

If omnisearch needs to be disabled:

### Quick Rollback

```bash
# Downgrade migration
cd backend
alembic downgrade -1

# Restart backend
systemctl restart appsec-platform-api

# Disable SearchCommand in frontend temporarily
# Edit frontend/src/components/layout/Header.tsx
# Remove SearchCommand and SearchCommandTrigger imports/usage
```

### Full Rollback

```bash
# Remove from frontend
git revert <commit-hash>
cd frontend && npm run build

# Remove from backend
git revert <commit-hash>
cd backend && alembic downgrade -1

# Redeploy both
./scripts/deploy.sh
```

## Monitoring & Alerts

### Prometheus Metrics (Optional)

Add to backend monitoring:

```python
from prometheus_client import Counter, Histogram

search_counter = Counter('omnisearch_requests_total', 'Total search requests')
search_latency = Histogram('omnisearch_latency_seconds', 'Search request latency')
search_errors = Counter('omnisearch_errors_total', 'Search errors')
```

### Alert Conditions

Set alerts for:

1. **Search endpoint response time > 500ms**
2. **Search errors > 1% of requests**
3. **Database connection pool exhausted**
4. **Index fragmentation > 50%**

## Deployment Checklist

- [ ] PostgreSQL pg_trgm extension installed
- [ ] Migration tested in staging
- [ ] All 16 indexes verified created
- [ ] Backend searches tested with sample queries
- [ ] Frontend SearchCommand tested (Ctrl+K, results click)
- [ ] Performance baseline established
- [ ] Monitoring/alerting configured
- [ ] Rollback plan documented
- [ ] Team trained on new search feature
- [ ] Production deployment completed
- [ ] Post-deployment verification passed

## Post-Deployment Validation

### Day 1
- Monitor error logs for any search-related errors
- Verify search response times are acceptable
- Check that all entity types return results

### Week 1
- Analyze search query patterns (what are users searching for?)
- Check for any performance regressions
- Gather user feedback on search experience

### Month 1
- Review index maintenance logs
- Analyze query performance trends
- Plan for any necessary optimizations

## Support & Documentation

### User Documentation

**Location**: Add to user guide/help docs:

```markdown
## Omnisearch

Use the omnisearch feature to quickly find vulnerabilities, plans, themes, and more.

### How to Search

1. Press **Ctrl+K** (Windows/Linux) or **Cmd+K** (Mac)
2. Type your search query
3. Results appear grouped by type
4. Click a result to jump to its detail page

### Search Tips

- Search is case-insensitive
- Searches across titles and descriptions
- Returns up to 10 results per category
- Supports partial word matching (e.g., "sql" finds "SQL Injection")
```

### Technical Support

For issues, check:
1. OMNISEARCH_IMPLEMENTATION.md - Feature details
2. OMNISEARCH_DEPLOYMENT.md - This file
3. Backend logs: `/var/log/appsec-platform/api.log`
4. Database logs: `/var/log/postgresql/postgresql.log`
