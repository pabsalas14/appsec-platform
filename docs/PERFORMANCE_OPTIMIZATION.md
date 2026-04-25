# Performance & Optimization Guide - Phase 26

## Database Optimization

### Indexing Strategy

```sql
-- Primary indexes (auto-created on FK/PK)
CREATE INDEX idx_vulnerabilidad_severidad ON vulnerabilidades(severidad);
CREATE INDEX idx_vulnerabilidad_estado ON vulnerabilidades(estado);
CREATE INDEX idx_vulnerabilidad_created_at ON vulnerabilidades(created_at DESC);
CREATE INDEX idx_vulnerabilidad_sla_dias ON vulnerabilidades(sla_dias);
CREATE INDEX idx_vulnerabilidad_soft_delete ON vulnerabilidades(deleted_at);

-- Composite indexes for common filters
CREATE INDEX idx_vuln_severity_estado ON vulnerabilidades(severidad, estado);
CREATE INDEX idx_vuln_fuente_estado ON vulnerabilidades(fuente, estado);

-- Partial index for soft delete (optimize list queries)
CREATE INDEX idx_vuln_active ON vulnerabilidades(id) WHERE deleted_at IS NULL;

-- Full text search (if applicable)
CREATE INDEX idx_vuln_titulo_desc_fts ON vulnerabilidades 
  USING GIN (to_tsvector('spanish', titulo || ' ' || descripcion));
```

### Query Optimization

1. **N+1 Query Prevention**
   - Use SQLAlchemy `joinedload()` and `selectinload()`
   - Load relationships eagerly in list endpoints
   - Batch load related entities

2. **Pagination Enforcement**
   - Default page_size: 50
   - Maximum page_size: 100
   - Required for all list endpoints

3. **Connection Pooling**
   ```python
   # In database.py
   engine = create_async_engine(
       DATABASE_URL,
       echo=False,
       pool_size=20,
       max_overflow=40,
       pool_pre_ping=True,  # Verify connection before use
   )
   ```

4. **Soft Delete Queries**
   - Automatic filtering: `WHERE deleted_at IS NULL`
   - Use partial index for active records
   - Partition audit logs by month if > 1M rows

### Database Maintenance

```sql
-- Analyze query plans
ANALYZE vulnerabilidades;

-- Reindex if fragmented
REINDEX INDEX CONCURRENTLY idx_vulnerabilidad_created_at;

-- Vacuum (cleanup)
VACUUM ANALYZE vulnerabilidades;

-- Monitor slow queries
ALTER SYSTEM SET log_min_duration_statement = 500;  -- Log queries > 500ms
SELECT query, mean_exec_time FROM pg_stat_statements 
  WHERE mean_exec_time > 500 
  ORDER BY mean_exec_time DESC;
```

---

## API Optimization

### Response Caching

```python
# Use Redis for expensive calculations
from fastapi import BackgroundTasks
from redis import Redis

redis_client = Redis(host='localhost', port=6379, db=0)

@router.get("/indicators/{indicator_id}/trend")
async def get_indicator_trend(indicator_id: str):
    # Check cache first (TTL: 1 hour)
    cache_key = f"indicator_trend:{indicator_id}"
    cached = redis_client.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    # Calculate and cache
    result = await calculate_trend(indicator_id)
    redis_client.setex(cache_key, 3600, json.dumps(result))
    
    return result
```

### Request/Response Compression

```python
# In main.py
from fastapi.middleware.gzip import GZIPMiddleware

app.add_middleware(GZIPMiddleware, minimum_size=1000)

# Nginx gzip (docker-compose.yml)
gzip on;
gzip_types text/plain application/json application/javascript;
gzip_min_length 1000;
gzip_vary on;
```

### Batch Operations Optimization

```python
# Bulk insert instead of individual inserts
from sqlalchemy import insert

def bulk_create_vulnerabilities(vulns_data: list[dict]):
    stmt = insert(Vulnerabilidad).values(vulns_data)
    db.execute(stmt)
    db.commit()
    # 100 inserts: 5 seconds → 0.2 seconds
```

### Connection Reuse

```python
# Reuse AsyncSession across endpoints
async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        yield session
        # Auto-close on function exit

# All endpoints use this dependency
@router.get("/vulnerabilities")
async def list_vulnerabilities(db: AsyncSession = Depends(get_db)):
    # Single pooled connection, auto-recycled
    pass
```

---

## Frontend Optimization

### Bundle Size Analysis

```bash
# Analyze bundle
npm run build
npx webpack-bundle-analyzer dist/stats.json

# Expected output < 500KB gzipped
# Target: Critical path < 100KB
```

### Code Splitting

```typescript
// pages/dashboards/index.tsx
const DashboardExecutivo = dynamic(
  () => import('./dashboards/ejecutivo'),
  { loading: () => <Skeleton /> }
);

const VulnerabilitiesDashboard = dynamic(
  () => import('./dashboards/vulnerabilities'),
  { loading: () => <Skeleton /> }
);
```

### Image Optimization

```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  experimental: {
    optimizePackageImports: {
      'lucide-react': ['Icon'], // Only import used icons
    },
  },
};
```

### Prefetching Strategy

```typescript
// prefetch common queries
import { useQuery } from '@tanstack/react-query';

export function usePrefetchVulnerabilities() {
  const queryClient = useQueryClient();
  
  return useCallback(() => {
    queryClient.prefetchInfiniteQuery({
      queryKey: ['vulnerabilities'],
      queryFn: ({ pageParam = 1 }) => fetchVulnerabilities(pageParam),
      getNextPageParam: (last) => last.nextPage,
    });
  }, [queryClient]);
}
```

---

## Monitoring & Metrics

### Application Performance Monitoring (APM)

```python
# backend/app/core/monitoring.py
import logging
from prometheus_client import Counter, Histogram, start_http_server
import time

request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

@app.middleware("http")
async def track_metrics(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    
    request_count.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response
```

### Database Monitoring

```sql
-- Monitor active queries
SELECT pid, query, query_start, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start DESC;

-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Health Check Endpoint

```python
@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """System health check"""
    
    checks = {
        "database": await check_database(db),
        "cache": await check_redis(),
        "api_latency_ms": await measure_api_latency(),
        "memory_usage_mb": get_memory_usage(),
    }
    
    overall = "healthy" if all(checks.values()) else "degraded"
    
    return {
        "status": overall,
        "timestamp": datetime.utcnow(),
        "checks": checks,
    }
```

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Page Load (LCP) | < 2.5s | TBD |
| API Response | < 200ms | TBD |
| Database Query | < 100ms | TBD |
| Bundle Size | < 500KB | TBD |
| Cache Hit Rate | > 80% | TBD |

---

## Deployment Checklist

- [ ] Database indexes created and analyzed
- [ ] Redis cache configured
- [ ] CDN configured for static assets
- [ ] Gzip compression enabled
- [ ] HTTP/2 enabled
- [ ] Security headers configured
- [ ] Rate limiting deployed
- [ ] Monitoring alerts configured
- [ ] Backup strategy implemented
