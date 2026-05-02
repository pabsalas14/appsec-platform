# SCR Module Load Testing Guide

**Purpose:** Validate SCR module can handle concurrent code security analysis requests without degradation  
**Target:** Ensure system handles at least 10 concurrent analyses with <2s response time  
**Tools:** Locust (Python-based load testing framework) + pytest + Apache JMeter alternative

---

## Load Testing Scenarios

### Scenario 1: Concurrent Review Creation (Light Load)
**Goal:** Validate review creation endpoint under typical load

```
- Users: 5 concurrent users
- Duration: 5 minutes
- Action per user: Create 1 review per 30 seconds
- Expected: 50 reviews created (5 users × 300s ÷ 30s)
- Success Criteria: 100% requests complete in <1s, no errors
```

### Scenario 2: Mixed Operations (Medium Load)
**Goal:** Simulate realistic user behavior

```
- Users: 10 concurrent users
- Duration: 10 minutes
- Actions (weighted):
  - 40% List reviews (1 req/min per user)
  - 30% View review detail (1 req/min per user)
  - 20% Create review (1 req/5min per user)
  - 10% Export report (1 req/10min per user)
- Expected: No degradation, <95% p95 response time
```

### Scenario 3: Analysis Pipeline Load (Heavy)
**Goal:** Validate concurrent analysis processing

```
- Users: 20 concurrent users
- Duration: 30 minutes
- Goal: Each user creates 1 review, monitors analysis completion
- Expected: All analyses complete within 30 minutes
- Success: <5% error rate, <30s analysis time per review
```

### Scenario 4: Database Stress Test (Extreme)
**Goal:** Identify database bottleneck

```
- Users: 50 concurrent users
- Duration: 10 minutes
- Action: Rapid list reviews with filters
- Expected: Identify resource saturation point
- Success: System handles 50 concurrent users without crashing
```

---

## Setup: Locust Framework

### 1. Install Locust
```bash
# In backend venv
pip install locust>=2.20.0
```

### 2. Create Locust Test File

**File:** `backend/tests/load_testing/locustfile.py`

```python
"""Load testing with Locust for SCR module endpoints."""

import random
import time
from locust import HttpUser, task, between, TaskSet, constant_pacing
from locust.contrib.fasthttp import FastHttpUser


class SCRTasks(TaskSet):
    """Define SCR user tasks for load testing."""

    def on_start(self):
        """Setup: Login and get auth token."""
        self.token = None
        self.review_ids = []
        self.login()

    def login(self):
        """Authenticate and get JWT token."""
        response = self.client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "password123"}
        )
        if response.status_code == 200:
            self.token = response.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            print(f"Login failed: {response.status_code}")

    @task(4)  # Weight: 40%
    def list_reviews(self):
        """List code security reviews."""
        filters = random.choice([
            {"estado": "PENDING"},
            {"estado": "ANALYZING"},
            {"estado": "COMPLETED"},
            {}
        ])
        response = self.client.get(
            "/api/v1/code_security_reviews",
            params={**filters, "skip": 0, "limit": 100},
            headers=self.headers,
            name="/code_security_reviews[LIST]"
        )
        if response.status_code == 200:
            reviews = response.json().get("data", [])
            self.review_ids = [r["id"] for r in reviews[:10]]  # Sample for detail views

    @task(3)  # Weight: 30%
    def view_review_detail(self):
        """View details of a specific review."""
        if not self.review_ids:
            self.list_reviews()
        
        review_id = random.choice(self.review_ids)
        response = self.client.get(
            f"/api/v1/code_security_reviews/{review_id}",
            headers=self.headers,
            name="/code_security_reviews/{id}[GET]"
        )
        self.last_viewed_review = review_id if response.status_code == 200 else None

    @task(2)  # Weight: 20%
    def create_review(self):
        """Create a new code security review."""
        payload = {
            "titulo": f"Load Test Review {int(time.time())}",
            "descripcion": "Automated load test",
            "url_repositorio": "https://github.com/example/repo",
            "tipo_escaneo": random.choice(["PUBLICO", "REPOSITORIO", "RAMA"]),
            "rama_analizar": "main"
        }
        response = self.client.post(
            "/api/v1/code_security_reviews",
            json=payload,
            headers=self.headers,
            name="/code_security_reviews[POST]"
        )
        if response.status_code == 201:
            new_review = response.json().get("data", {})
            self.review_ids.append(new_review.get("id"))

    @task(1)  # Weight: 10%
    def export_review(self):
        """Export review as PDF/JSON."""
        if not self.review_ids or len(self.review_ids) < 2:
            return
        
        review_id = random.choice(self.review_ids[:5])  # Sample of recent
        format_type = random.choice(["json", "pdf"])
        
        response = self.client.get(
            f"/api/v1/code_security_reviews/{review_id}/export",
            params={"format": format_type},
            headers=self.headers,
            name="/code_security_reviews/{id}/export[GET]"
        )


class SCRUser(FastHttpUser):
    """Simulated user accessing SCR endpoints."""

    tasks = [SCRTasks]
    wait_time = between(1, 3)  # Random wait 1-3 seconds between tasks


class SCRContinuousUser(FastHttpUser):
    """User with constant pacing (every 1 second)."""

    tasks = [SCRTasks]
    wait_time = constant_pacing(1)
```

### 3. Run Locust Tests

**Light Load Test:**
```bash
cd backend

# Terminal 1: Web UI
locust -f tests/load_testing/locustfile.py \
    --host=http://localhost:8000 \
    --users=5 \
    --spawn-rate=1 \
    --run-time=5m \
    -u 5

# Navigate to http://localhost:8089 and start test
```

**Heavy Load Test (CLI mode):**
```bash
locust -f tests/load_testing/locustfile.py \
    --host=http://localhost:8000 \
    --users=20 \
    --spawn-rate=2 \
    --run-time=10m \
    --headless \
    --csv=load-test-results
```

---

## Alternative: Apache JMeter

### 1. Install JMeter
```bash
# macOS
brew install jmeter

# Or download from https://jmeter.apache.org/download_jmeter.cgi
```

### 2. Create Test Plan

**File:** `backend/tests/load_testing/scr_load_test.jmx`

(JMeter test plan in XML format - can be created via GUI)

### 3. Run JMeter Test
```bash
jmeter -n -t scr_load_test.jmx -l results.jtl -j jmeter.log -Jusers=10 -Jduration=600
```

---

## Performance Baselines (Target Metrics)

| Metric | Target | Threshold |
|--------|--------|-----------|
| **Response Time (p50)** | <200ms | >500ms = FAIL |
| **Response Time (p95)** | <1s | >2s = FAIL |
| **Response Time (p99)** | <2s | >5s = FAIL |
| **Throughput** | >50 req/sec | <20 req/sec = FAIL |
| **Error Rate** | <1% | >5% = FAIL |
| **Success Rate** | >99% | <95% = FAIL |
| **CPU Usage** | <70% | >90% = FAIL |
| **Memory Usage** | <2GB | >4GB = FAIL |
| **Database Connections** | <50 | >100 = FAIL |

---

## Load Test Analysis

### 1. Interpreting Locust Results

**Response Time Distribution:**
```
GET /code_security_reviews
  Number of requests: 1000
  Number of failures: 0
  Median response time: 150ms
  Average response time: 210ms
  Min response time: 45ms
  Max response time: 2500ms
  
  Requests/sec: 55
  Failures/sec: 0
```

**Interpretation:**
- ✅ Median (150ms) is good
- ✅ Error rate 0% is excellent
- ⚠️ Max (2500ms) spike indicates possible GC pause or timeout
- ✅ Throughput (55 req/sec) meets target

### 2. Database Query Performance

**Check slow queries during load test:**
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- 1 second threshold

-- Review slow queries
SHOW PROCESSLIST;  -- Active queries
SELECT * FROM mysql.slow_log LIMIT 100;  -- After test
```

**Identify bottlenecks:**
- Review queries > 500ms
- Check indexes on filter columns (estado, user_id, created_at)
- Look for N+1 queries in finding loading

### 3. System Resource Monitoring

**Monitor during test:**
```bash
# CPU/Memory
top -i -n 100  # Update every 1s, 100 iterations

# Database connections
# PostgreSQL
SELECT count(*) FROM pg_stat_activity;

# Disk I/O
iostat -x 1  # Update every 1s

# Network throughput
iftop -n
```

---

## Optimization Based on Results

### If Response Time > 500ms:
1. **Check database indexes:**
   ```sql
   CREATE INDEX idx_code_security_review_user_estado
   ON code_security_reviews(user_id, estado, created_at DESC);
   ```

2. **Enable Redis caching:**
   ```python
   # Cache review list for 30 seconds
   CACHE_KEY = f"reviews:{user_id}:{estado}"
   cached = redis.get(CACHE_KEY)
   if cached:
       return json.loads(cached)
   ```

3. **Async analysis:**
   - Ensure analysis runs in background task
   - Don't block review creation on analysis completion

### If Error Rate > 1%:
1. **Check error logs:**
   ```bash
   tail -f logs/scr_*.log | grep ERROR
   ```

2. **Common causes:**
   - Rate limiting exceeded (increase limit)
   - Database connection pool exhausted (increase pool size)
   - Timeout (increase timeout value)

3. **Fix:**
   ```python
   # Increase connection pool
   engine = create_async_engine(
       DATABASE_URL,
       echo=False,
       pool_size=20,  # Up from default 5
       max_overflow=40,  # Additional connections
       pool_pre_ping=True,  # Verify connections alive
   )
   ```

### If Throughput < 50 req/sec:
1. **Add database read replicas** (if available)
2. **Implement horizontal scaling** (multiple backend instances)
3. **Enable query result caching** (Redis)
4. **Profile hot paths** with Python profiler:
   ```bash
   pip install py-spy
   py-spy record -o profile.svg -- python -m pytest ...
   ```

---

## Continuous Performance Monitoring

### 1. Post-Deployment Monitoring

**Setup Prometheus metrics:**
```python
# In endpoints
from prometheus_client import Counter, Histogram

request_count = Counter(
    'scr_requests_total',
    'Total SCR requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'scr_request_duration_seconds',
    'SCR request duration',
    ['method', 'endpoint']
)

@router.get("")
async def list_reviews(...):
    with request_duration.labels('GET', 'list_reviews').time():
        # ... endpoint logic ...
        request_count.labels('GET', 'list_reviews', 200).inc()
```

### 2. Weekly Load Test Schedule

**Automated:**
```bash
# .github/workflows/load-test.yml
name: Weekly Load Test

on:
  schedule:
    - cron: '0 3 * * MON'  # Every Monday at 3 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run load test
        run: |
          locust -f tests/load_testing/locustfile.py \
            --host=${{ secrets.STAGING_URL }} \
            --users=10 \
            --run-time=10m \
            --headless \
            --csv=results
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.*
```

### 3. Performance Regression Detection

**Alert if:**
- Response time p95 increases >20% from baseline
- Error rate >0.5%
- Throughput drops >10%

```python
# Example threshold check
baseline_p95 = 1000  # ms
current_p95 = get_current_p95()

if current_p95 > baseline_p95 * 1.2:
    send_alert(f"P95 response time regression: {current_p95}ms")
```

---

## Success Criteria Checklist

- [ ] ✅ All response times <1s (p95) under 10 concurrent users
- [ ] ✅ Error rate <1% over 10+ minute test
- [ ] ✅ Database maintains <50 active connections
- [ ] ✅ CPU usage <70% during peak load
- [ ] ✅ Memory usage stable (no leaks detected)
- [ ] ✅ Analysis completes within 30min for all concurrent requests
- [ ] ✅ No connection timeouts or pool exhaustion
- [ ] ✅ Query response times consistent (no >5x spikes)

---

## Troubleshooting

### Test Won't Start
```
Error: Connection refused to localhost:8000

Solution:
1. Ensure backend running: docker-compose up backend
2. Check port 8000 open: lsof -i :8000
3. Increase connections: export LOCUST_STOP_TIMEOUT=60
```

### High Error Rate During Test
```
Error: 502 Bad Gateway

Causes:
1. Backend overloaded → increase spawn-rate
2. Database connections exhausted → increase pool
3. Memory exhaustion → check for memory leaks

Debug:
docker-compose logs backend | grep -i error
```

### Unrealistic Test Results
```
Issue: All requests <10ms (unrealistic)

Causes:
1. Test not hitting actual backend
2. Caching everything
3. Test data too small

Fix:
- Verify --host points to correct URL
- Use unique IDs per test run
- Use real-size payloads
```

---

## References

- [Locust Documentation](https://locust.io/docs/)
- [Apache JMeter](https://jmeter.apache.org/)
- [Performance Testing Best Practices](https://wiki.apache.org/jmeter/BestPractices)
- [SLA Metrics for APIs](https://grafana.com/blog/2022/01/19/latency-slos/)
