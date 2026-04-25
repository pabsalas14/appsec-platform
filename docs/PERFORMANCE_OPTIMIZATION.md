# AppSec Platform — Performance Optimization Guide

## Phase 26 Optimizations

### Database Optimization

#### 1. Index Strategy

**Critical Indexes (already in place):**
```sql
-- User ownership queries (IDOR filtering)
CREATE INDEX idx_vulnerabilidads_user_id ON vulnerabilidads(user_id);
CREATE INDEX idx_iniciativas_user_id ON iniciativas(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(actor_user_id);

-- Time-based queries
CREATE INDEX idx_audit_logs_ts ON audit_logs(ts DESC);
CREATE INDEX idx_vulnerabilidads_created_at ON vulnerabilidads(created_at DESC);

-- SLA tracking
CREATE INDEX idx_vulnerabilidads_fecha_sla ON vulnerabilidads(fecha_limite_sla);
CREATE INDEX idx_vulnerabilidads_estado ON vulnerabilidads(estado);

-- Soft delete filtering
CREATE INDEX idx_vulnerabilidads_deleted_at ON vulnerabilidads(deleted_at) 
  WHERE deleted_at IS NULL;
```

**Query Optimization:**
```python
# BAD: N+1 query
for vuln in vulnerabilidads:
    user = session.query(User).filter(User.id == vuln.user_id).first()
    
# GOOD: Single query with relationship loading
vulns = session.query(Vulnerabilidad).options(
    joinedload(Vulnerabilidad.usuario)
).all()

# GOOD: Selective loading
vulns = session.query(Vulnerabilidad).filter(...).limit(100)
```

#### 2. Connection Pooling

**Settings in `database.py`:**
```python
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,           # Number of connections to keep open
    max_overflow=20,        # Max additional connections
    pool_pre_ping=True,     # Verify connection before use
    pool_recycle=3600,      # Recycle connections after 1 hour
)
```

#### 3. Query Analysis

```bash
# Log slow queries (> 100ms)
# In PostgreSQL:
ALTER SYSTEM SET log_min_duration_statement = 100;
SELECT pg_reload_conf();

# View slow log
docker-compose exec db tail -f /var/log/postgresql/postgresql.log | grep Duration
```

### API Optimization

#### 1. Pagination Defaults

```python
# backend/app/api/deps.py
class PaginationParams:
    DEFAULT_PAGE_SIZE = 50
    MAX_PAGE_SIZE = 100
    
    def __init__(self, page: int = 1, page_size: int = DEFAULT_PAGE_SIZE):
        self.page = max(1, page)
        self.page_size = min(page_size, self.MAX_PAGE_SIZE)
```

#### 2. Response Compression

**In Nginx:**
```nginx
gzip on;
gzip_types application/json text/plain;
gzip_min_length 1000;
gzip_comp_level 6;
```

**Reduces payload by ~60% for JSON**

#### 3. Selective Field Loading

```python
# BAD: Load all fields
vulnerabilidad_full = session.query(Vulnerabilidad).get(id)

# GOOD: Load only needed fields for list view
vulnerabilidades = session.query(
    Vulnerabilidad.id,
    Vulnerabilidad.titulo,
    Vulnerabilidad.estado,
    Vulnerabilidad.severidad,
    Vulnerabilidad.fecha_limite_sla,
).filter(...).all()
```

#### 4. Caching Strategy

**For frequently accessed, slow-changing data:**
```python
from redis import Redis
import json

cache = Redis(host='redis', port=6379)

# Cache catalog configs (5 min TTL)
@cache.cached(timeout=300)
async def get_severity_config():
    return await system_setting_svc.get(db, "sla.severidades")

# Cache user roles (1 min TTL, refreshed on role change)
async def get_user_roles(user_id: UUID, force_refresh: bool = False):
    if not force_refresh:
        cached = cache.get(f"user_roles:{user_id}")
        if cached:
            return json.loads(cached)
    
    roles = await role_svc.get_by_user(db, user_id)
    cache.setex(f"user_roles:{user_id}", 60, json.dumps([r.to_dict() for r in roles]))
    return roles
```

#### 5. Batch Operations

```python
# BAD: Update one at a time (N queries)
for vuln_id in vulnerability_ids:
    update_vulnerability(db, vuln_id, {"estado": "En Revision"})

# GOOD: Batch update (1 query)
await db.execute(
    update(Vulnerabilidad)
    .where(Vulnerabilidad.id.in_(vulnerability_ids))
    .values({"estado": "En Revision", "updated_at": datetime.utcnow()})
)
await db.flush()
```

### Frontend Optimization

#### 1. Code Splitting

```typescript
// pages/dashboards/[id].tsx
const DashboardExecutivo = dynamic(() => import("@/components/dashboards/Ejecutivo"), {
  loading: () => <div>Loading dashboard...</div>,
  ssr: false, // Don't server-side render heavy components
});
```

#### 2. Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/icons/vulnerability.svg"
  alt="Vulnerability"
  width={24}
  height={24}
  quality={85}  // Reduce quality for faster load
/>
```

#### 3. Query Prefetching

```typescript
const { data, isLoading } = useQuery({
  queryKey: ["vulnerabilities"],
  queryFn: async () => {
    const res = await fetch("/api/v1/vulnerabilidads?page_size=10");
    return res.json();
  },
});

// Prefetch next page on mount
const queryClient = useQueryClient();
useEffect(() => {
  queryClient.prefetchInfiniteQuery({
    queryKey: ["vulnerabilities"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/v1/vulnerabilidads?page=${pageParam + 1}`);
      return res.json();
    },
  });
}, []);
```

### Monitoring & Benchmarking

#### 1. Response Time Tracking

```python
# Middleware to track endpoint performance
@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    
    logger.info(
        f"{request.method} {request.url.path}",
        extra={
            "status": response.status_code,
            "duration_ms": duration,
            "event": "api_timing",
        }
    )
    
    if duration > 500:  # Log slow endpoints
        logger.warning(f"Slow endpoint: {duration}ms", extra={"slow": True})
    
    return response
```

#### 2. Database Query Metrics

```python
# SQLAlchemy event listener for query logging
from sqlalchemy import event

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.time()

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total_time = time.time() - context._query_start_time
    if total_time > 0.5:  # Log queries > 500ms
        logger.warning(f"Slow query ({total_time:.2f}s): {statement[:100]}...")
```

#### 3. Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
   http://localhost:8000/api/v1/vulnerabilidads

# Using wrk
wrk -t12 -c400 -d30s \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/api/v1/vulnerabilidads
```

**Expected Performance:**
- API P95: < 500ms
- Database query P95: < 100ms
- API error rate: < 1%
- Throughput: > 100 req/sec

### Capacity Planning

| Metric | Current | Target | Action |
|--------|---------|--------|--------|
| Users | 100 | 10,000 | Add connection pooling |
| Vulnerabilities | 10K | 1M | Partition audit logs, add caching |
| Audit entries/day | 50K | 5M | Archive old logs, optimize indices |
| Peak QPS | 10 | 100 | Add load balancer, replicas |

### Rollback Optimization

If optimization causes issues:

1. **Revert cache:** `redis-cli FLUSHALL`
2. **Revert indices:** `DROP INDEX idx_name;`
3. **Revert connection pool:** `ALTER SYSTEM SET max_connections = 100;`

---

**Target Performance Metrics:**
- API P95 latency: < 500ms
- Database query P95: < 100ms
- Page load time: < 2s
- Error rate: < 1%
- Throughput: > 100 req/sec

**Monitoring Tools:**
- Prometheus for metrics collection
- Grafana for visualization
- ELK Stack for log analysis
