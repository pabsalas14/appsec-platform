# Database Migration Validation Guide

**Purpose:** Ensure all SCR module migrations are safe, reversible, and maintain data integrity  
**Scope:** All `alembic/versions/*scr*.py` migration files  
**Status:** Review checklist for all migrations

---

## Migration Checklist

### Pre-Migration Validation

#### ✅ Code Review
- [ ] Review migration file for:
  - No raw SQL (use Alembic helper functions)
  - Correct column names and types
  - Proper foreign key constraints
  - Index creation for performance
  - No hardcoded user data or credentials

- [ ] Verify migration follows naming convention:
  - Format: `{timestamp}_{description}.py`
  - Example: `20240501_121530_add_code_security_module.py`

- [ ] Check migration imports:
  ```python
  # ✓ Correct
  from alembic import op
  import sqlalchemy as sa
  from sqlalchemy.dialects import postgresql
  
  # ✗ Avoid
  import sqlalchemy.dialects.postgresql as postgresql  # Non-standard
  ```

#### ✅ Backward Compatibility
- [ ] Migration includes `downgrade()` function
- [ ] Downgrade reverses all changes made in `upgrade()`
- [ ] Downgrade can be run without errors
- [ ] Foreign keys properly ordered (create before referencing)

#### ✅ Schema Validation
- [ ] All tables have primary keys
- [ ] All foreign key columns are indexed
- [ ] String columns have length limits
- [ ] Timestamp columns use `server_default=func.now()`
- [ ] Soft-delete tables have `deleted_at` column (nullable)

---

## Migration Patterns

### Pattern 1: Create New Table ✓

**Good:**
```python
def upgrade():
    op.create_table(
        'code_security_reviews',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('titulo', sa.String(255), nullable=False),
        sa.Column('estado', sa.String(50), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.Index('idx_code_security_review_user', 'user_id'),
    )

def downgrade():
    op.drop_table('code_security_reviews')
```

**Bad:**
```python
def upgrade():
    op.create_table(
        'code_security_reviews',
        sa.Column('id', sa.Integer()),  # ✗ Wrong type (should be UUID)
        sa.Column('user_id', sa.UUID()),  # ✗ No FK constraint
        sa.Column('titulo', sa.String()),  # ✗ No length limit
        sa.Column('created_at', sa.DateTime()),  # ✗ No timezone, no default
    )
    # ✗ Missing downgrade() function!
```

### Pattern 2: Add Column

**Good:**
```python
def upgrade():
    op.add_column(
        'code_security_reviews',
        sa.Column('progreso', sa.Integer(), nullable=False, server_default='0')
    )
    # Commit transaction after default set
    op.alter_column('code_security_reviews', 'progreso', existing_type=sa.Integer(), server_default=None)

def downgrade():
    op.drop_column('code_security_reviews', 'progreso')
```

**Bad:**
```python
def upgrade():
    op.add_column(
        'code_security_reviews',
        sa.Column('progreso', sa.Integer(), nullable=False)  # ✗ No default for existing rows!
    )
```

### Pattern 3: Add Foreign Key

**Good:**
```python
def upgrade():
    # Ensure referenced table exists first
    op.create_foreign_key(
        'fk_code_security_finding_review',
        'code_security_findings',
        'code_security_reviews',
        ['review_id'],
        ['id'],
        ondelete='CASCADE'  # ✓ Specify cascade behavior
    )
    # Also create index for performance
    op.create_index(
        'idx_code_security_finding_review',
        'code_security_findings',
        ['review_id']
    )

def downgrade():
    op.drop_index('idx_code_security_finding_review', 'code_security_findings')
    op.drop_constraint('fk_code_security_finding_review', 'code_security_findings')
```

**Bad:**
```python
def upgrade():
    # ✗ No cascade rule
    # ✗ No index created (slow queries)
    # ✗ No downgrade()
    op.create_foreign_key(
        'fk_code_security_finding_review',
        'code_security_findings',
        'code_security_reviews',
        ['review_id'],
        ['id']
    )
```

### Pattern 4: Data Migration (Backfill)

**Good:**
```python
def upgrade():
    # First, add nullable column
    op.add_column(
        'code_security_findings',
        sa.Column('risk_score', sa.Integer(), nullable=True)
    )
    
    # Then backfill data in batches (avoid locking entire table)
    connection = op.get_bind()
    connection.execute(sa.text(
        """
        UPDATE code_security_findings
        SET risk_score = CASE
            WHEN severidad = 'CRITICO' THEN 95
            WHEN severidad = 'ALTO' THEN 75
            WHEN severidad = 'MEDIO' THEN 45
            WHEN severidad = 'BAJO' THEN 15
        END
        WHERE risk_score IS NULL
        """
    ))
    
    # Finally, make NOT NULL
    op.alter_column(
        'code_security_findings',
        'risk_score',
        existing_type=sa.Integer(),
        nullable=False
    )

def downgrade():
    op.drop_column('code_security_findings', 'risk_score')
```

**Bad:**
```python
def upgrade():
    # ✗ Locks table during data migration
    # ✗ No error handling
    # ✗ Could timeout on large tables
    op.add_column('code_security_findings', sa.Column('risk_score', sa.Integer(), nullable=False))
    # Magic numbers without explanation
    connection.execute(sa.text("UPDATE code_security_findings SET risk_score = 50"))
```

---

## Testing Migrations

### Test 1: Local Upgrade/Downgrade Cycle

```bash
# Setup
docker-compose up -d postgres

# Apply all migrations
alembic upgrade head
# Expected: "INFO [alembic.migration] Running upgrade ... 20240502_scr_complete"

# Verify schema
docker-compose exec postgres psql -U postgres -d appsec -c "\dt code_security*"
# Expected: Tables exist with correct columns

# Test downgrade
alembic downgrade -1
# Expected: Last migration reversed successfully

# Test upgrade again
alembic upgrade head
# Expected: Migration applied again without errors

# Verify idempotency (can run multiple times)
alembic upgrade head
# Expected: "No changes found"
```

### Test 2: Data Integrity After Migration

```python
# backend/tests/test_migrations.py
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

class TestCodeSecurityMigrations:
    """Validate SCR migrations preserve data integrity."""

    @pytest.mark.asyncio
    async def test_code_security_reviews_table_structure(self, db: AsyncSession):
        """Verify CodeSecurityReview table has expected columns."""
        result = await db.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'code_security_reviews'"
        ))
        columns = {row[0] for row in result}
        
        expected = {
            'id', 'user_id', 'titulo', 'estado', 'progreso',
            'created_at', 'updated_at', 'deleted_at'
        }
        assert expected.issubset(columns), f"Missing columns: {expected - columns}"

    @pytest.mark.asyncio
    async def test_foreign_key_constraints(self, db: AsyncSession):
        """Verify foreign key constraints exist."""
        result = await db.execute(text(
            "SELECT constraint_name FROM information_schema.table_constraints "
            "WHERE table_name = 'code_security_reviews' "
            "AND constraint_type = 'FOREIGN KEY'"
        ))
        fks = {row[0] for row in result}
        assert 'fk_code_security_review_user' in fks

    @pytest.mark.asyncio
    async def test_indexes_created(self, db: AsyncSession):
        """Verify performance indexes exist."""
        result = await db.execute(text(
            "SELECT indexname FROM pg_indexes "
            "WHERE tablename = 'code_security_reviews'"
        ))
        indexes = {row[0] for row in result}
        
        expected = {'idx_code_security_review_user', 'idx_code_security_review_estado'}
        for idx in expected:
            assert idx in indexes, f"Missing index: {idx}"

    @pytest.mark.asyncio
    async def test_no_null_violations(self, db: AsyncSession):
        """Verify NOT NULL constraints are enforced."""
        # Try to insert NULL in NOT NULL column - should fail
        from sqlalchemy import insert
        from app.models.code_security_review import CodeSecurityReview
        
        with pytest.raises(Exception):  # IntegrityError
            stmt = insert(CodeSecurityReview).values(
                id=None,  # Should fail
                user_id="550e8400-e29b-41d4-a716-446655440000",
                titulo="Test"
            )
            await db.execute(stmt)
```

### Test 3: Migration Chain Integrity

```bash
# Verify migration chain is unbroken
alembic current
# Expected: Headword is latest migration

alembic branches
# Expected: No branches (linear history)

alembic history --verbose
# Expected: All migrations in correct order with no gaps
```

---

## Pre-Deployment Validation

### On Staging Environment

```bash
# 1. Backup database
pg_dump -U postgres -d appsec > backup-pre-migration.sql

# 2. Test full migration cycle
alembic upgrade head
# Monitor for locks: SELECT * FROM pg_stat_activity;

# 3. Run full test suite
pytest backend/tests/ -v --tb=short

# 4. Load test (10 concurrent users, 5 minutes)
locust -f backend/tests/load_testing/locustfile.py \
    --host=https://staging.example.com \
    --users=10 \
    --run-time=5m \
    --headless

# 5. Verify performance not degraded
# Check P95 response time compared to baseline
```

### On Production (Maintenance Window)

```bash
# 1. Create backup
pg_dump -U postgres -d appsec | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# 2. Run migration with monitoring
time alembic upgrade head

# 3. Monitor for errors
tail -f /var/log/application.log | grep -i error

# 4. Quick sanity checks
curl https://api.example.com/api/v1/code_security_reviews -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with list of reviews

# 5. If rollback needed
alembic downgrade -1  # One migration back
# or restore backup: psql -U postgres -d appsec < backup-*.sql.gz
```

---

## Common Migration Mistakes

### Mistake 1: Missing Index on Foreign Key
```python
# ✗ BAD: FK without index = slow joins
def upgrade():
    op.create_foreign_key(
        'fk_finding_review',
        'code_security_findings',
        'code_security_reviews',
        ['review_id'],
        ['id']
    )

# ✓ GOOD: Add index
def upgrade():
    op.create_foreign_key(
        'fk_finding_review',
        'code_security_findings',
        'code_security_reviews',
        ['review_id'],
        ['id']
    )
    op.create_index('idx_finding_review', 'code_security_findings', ['review_id'])
```

### Mistake 2: NOT NULL Column Without Default
```python
# ✗ BAD: Will fail on existing tables
def upgrade():
    op.add_column('code_security_reviews', sa.Column('risk_score', sa.Integer(), nullable=False))

# ✓ GOOD: Backfill existing rows first
def upgrade():
    op.add_column('code_security_reviews', sa.Column('risk_score', sa.Integer(), nullable=True))
    # Backfill
    op.execute("UPDATE code_security_reviews SET risk_score = 50")
    # Make NOT NULL
    op.alter_column('code_security_reviews', 'risk_score', nullable=False)
```

### Mistake 3: Missing Downgrade
```python
# ✗ BAD: Cannot rollback
def upgrade():
    op.create_table('new_table', ...)
    # Missing: def downgrade()

# ✓ GOOD: Always provide downgrade
def upgrade():
    op.create_table('new_table', ...)

def downgrade():
    op.drop_table('new_table')
```

### Mistake 4: Breaking Changes in Production
```python
# ✗ BAD: Breaks running code
def upgrade():
    op.drop_column('code_security_reviews', 'titulo')  # Code still uses this!

# ✓ GOOD: Deprecation period
# Migration 1: Mark as deprecated in code, keep column
# Migration 2 (after 1-2 releases): Drop column
# Or use feature flags to gradually migrate
```

---

## Migration Validation Checklist

| Item | Check | Status |
|------|-------|--------|
| Code Review | No raw SQL, proper syntax | ☐ |
| Backward Compatibility | Downgrade function exists and works | ☐ |
| Schema Validation | All constraints, indexes, defaults present | ☐ |
| Testing | Local upgrade/downgrade works | ☐ |
| Data Integrity | No data loss, foreign keys valid | ☐ |
| Performance | Indexes on FKs, no table locks | ☐ |
| Staging | Full migration cycle passes on staging | ☐ |
| Documentation | Migration purpose documented | ☐ |
| Rollback | Downgrade tested and verified | ☐ |
| Production | Migration applied successfully | ☐ |

---

## Emergency Rollback Procedure

**If migration causes problems in production:**

```bash
# 1. Identify last good migration
alembic current
# Output: f3b3d5a2e1c8_old_working_migration

# 2. Create backup FIRST
pg_dump -U postgres -d appsec > pre-rollback-$(date +%s).sql.gz

# 3. Rollback to previous version
alembic downgrade -1
# or specific version
alembic downgrade f3b3d5a2e1c8

# 4. Verify application still works
curl https://api.example.com/health
# Expected: 200 OK

# 5. Identify issue and create new migration
# - Fix the buggy migration
# - Create new migration with fix
# - Re-test on staging
# - Re-apply to production
```

---

## References

- [Alembic Documentation](https://alembic.sqlalchemy.org/en/latest/)
- [SQLAlchemy Column Types](https://docs.sqlalchemy.org/en/20/core/types.html)
- [PostgreSQL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Database Migration Best Practices](https://wiki.postgresql.org/wiki/Safely_renaming_a_table_with_zero_downtime)
