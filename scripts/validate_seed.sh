#!/usr/bin/env bash
# validate_seed.sh — Quick validation script after running seed

set -e

echo "🔍 Validando datos generados por seed masivo..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection
DB_HOST=${DB_HOST:-localhost}
DB_NAME=${DB_NAME:-appsec_dev}
DB_USER=${DB_USER:-appsec_user}

# Function to run SQL
run_sql() {
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "$1"
}

check_count() {
    local entity=$1
    local table=$2
    local min_count=$3
    
    count=$(run_sql "SELECT COUNT(*) FROM $table;")
    
    if [ "$count" -ge "$min_count" ]; then
        echo -e "${GREEN}✓${NC} $entity: $count (expected ≥ $min_count)"
        return 0
    else
        echo -e "${RED}✗${NC} $entity: $count (expected ≥ $min_count) — FAILED"
        return 1
    fi
}

check_distribution() {
    local entity=$1
    local query=$2
    
    echo -e "${YELLOW}📊${NC} $entity distribution:"
    run_sql "$query" | head -10 | sed 's/^/   /'
}

# Run checks
echo "📝 Basic Entity Counts:"
check_count "Users (masivos)" "users" 11
check_count "Organizations" "organizacions" 3
check_count "Subdirecciones" "subdireccions" 15
check_count "Gerencias" "gerencias" 50
check_count "Células" "celulas" 70
check_count "Vulnerabilities" "vulnerabilidads" 100
check_count "Service Releases" "service_releases" 20
check_count "Iniciativas" "iniciativas" 6
check_count "Auditorías" "auditorias" 12
check_count "Temas Emergentes" "temas_emergentes" 15

echo ""
echo "📊 Data Distributions:"
check_distribution "Vulnerabilities by Severity" \
    "SELECT severidad, COUNT(*) as cnt FROM vulnerabilidads GROUP BY severidad ORDER BY cnt DESC;"

check_distribution "Service Releases by State" \
    "SELECT estado_actual, COUNT(*) as cnt FROM service_releases GROUP BY estado_actual ORDER BY cnt DESC;"

check_distribution "Audits by Type" \
    "SELECT tipo, COUNT(*) as cnt FROM auditorias GROUP BY tipo ORDER BY cnt DESC;"

check_distribution "Initiatives by State" \
    "SELECT estado, COUNT(*) as cnt FROM iniciativas GROUP BY estado ORDER BY cnt DESC;"

echo ""
echo "🔗 Relationship Integrity:"

# Check foreign keys
repo_count=$(run_sql "SELECT COUNT(*) FROM repositorios WHERE celula_id IS NOT NULL;")
echo -e "${GREEN}✓${NC} Repositorios with valid celula_id: $repo_count"

vuln_count=$(run_sql "SELECT COUNT(*) FROM vulnerabilidads WHERE repositorio_id IS NOT NULL AND estado NOT IN ('Cerrada');")
echo -e "${GREEN}✓${NC} Active Vulnerabilities linked to Repositorios: $vuln_count"

org_count=$(run_sql "SELECT COUNT(*) FROM celulas WHERE organizacion_id IS NOT NULL;")
echo -e "${GREEN}✓${NC} Células linked to Organizaciones: $org_count"

echo ""
echo "✨ Idempotency Check:"
ciso_count=$(run_sql "SELECT COUNT(*) FROM users WHERE username = 'ciso1';")
if [ "$ciso_count" -eq 1 ]; then
    echo -e "${GREEN}✓${NC} CISO user count = 1 (idempotent)"
else
    echo -e "${RED}✗${NC} CISO user count = $ciso_count (not idempotent) — FAILED"
fi

echo ""
echo "📈 Summary:"
total=$(run_sql "SELECT COUNT(*) FROM users;")
echo -e "Total Users: $total"

total=$(run_sql "SELECT COUNT(*) FROM vulnerabilidads;")
echo -e "Total Vulnerabilities: $total"

total=$(run_sql "SELECT COUNT(*) FROM organizacions;")
echo -e "Total Organizations: $total"

echo ""
echo -e "${GREEN}✅ Seed validation complete!${NC}"
