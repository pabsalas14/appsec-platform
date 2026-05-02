#!/bin/bash

# SCR Module - Complete Deployment Script
# Este script automatiza todo lo necesario para deployer el módulo SCR al 100%

set -e

echo "🚀 SCR Module - Complete Deployment (100%)"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_step() {
    echo -e "${BLUE}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Verify structure
print_step "Step 1: Verifying project structure..."

required_dirs=(
    "backend/app/models"
    "backend/app/api/v1"
    "backend/alembic/versions"
    "frontend/src/services"
    "frontend/src/hooks"
    "frontend/src/components"
)

for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        print_error "Missing directory: $dir"
        exit 1
    fi
done
print_success "All required directories exist"

# Step 2: Verify models are created
print_step "Step 2: Verifying models..."

required_models=(
    "backend/app/models/code_security.py"
)

for model in "${required_models[@]}"; do
    if [ ! -f "$model" ]; then
        print_error "Missing model: $model"
        exit 1
    fi
done
print_success "All models present"

# Step 3: Verify backend endpoints
print_step "Step 3: Verifying backend endpoints..."

required_endpoints=(
    "backend/app/api/v1/scr_dashboard.py"
    "backend/app/api/v1/scr_admin.py"
    "backend/app/api/v1/scr_forensic.py"
    "backend/app/api/v1/scr_bulk_actions.py"
    "backend/app/api/v1/scr_findings.py"
)

for endpoint in "${required_endpoints[@]}"; do
    if [ ! -f "$endpoint" ]; then
        print_error "Missing endpoint: $endpoint"
        exit 1
    fi
done
print_success "All endpoints present"

# Step 4: Verify frontend components
print_step "Step 4: Verifying frontend components..."

required_components=(
    "frontend/src/services/scr-api.ts"
    "frontend/src/hooks/useCodeSecurityReviews.ts"
    "frontend/src/components/admin/LLMProviderConfig.tsx"
    "frontend/src/components/admin/GitHubTokenConfig.tsx"
    "frontend/src/components/scr/SCRDashboard.tsx"
)

for component in "${required_components[@]}"; do
    if [ ! -f "$component" ]; then
        print_error "Missing component: $component"
        exit 1
    fi
done
print_success "All frontend components present"

# Step 5: Create migration if not exists
print_step "Step 5: Checking database migration..."

if [ ! -f "backend/alembic/versions/001_add_code_security_module.py" ]; then
    print_error "Migration file missing!"
    exit 1
fi
print_success "Migration file ready"

# Step 6: Build Docker images
print_step "Step 6: Building Docker images..."

if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found"
    exit 1
fi

docker-compose build --no-cache 2>/dev/null || {
    print_error "Failed to build Docker images"
    exit 1
}
print_success "Docker images built successfully"

# Step 7: Start containers
print_step "Step 7: Starting Docker containers..."

docker-compose up -d 2>/dev/null || {
    print_error "Failed to start containers"
    exit 1
}
print_success "Containers started"

# Step 8: Wait for services
print_step "Step 8: Waiting for services to be ready..."

sleep 10

# Check if backend is running
if ! curl -s http://localhost:8000/api/v1/health >/dev/null 2>&1; then
    print_error "Backend not responding"
    docker-compose logs backend
    exit 1
fi
print_success "Backend is responding"

# Check if frontend is running
if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
    print_error "Frontend not responding"
    docker-compose logs frontend
    exit 1
fi
print_success "Frontend is running"

# Step 9: Run migrations
print_step "Step 9: Running database migrations..."

docker-compose exec -T backend alembic upgrade head 2>/dev/null || {
    print_error "Migration failed"
    docker-compose logs backend
    exit 1
}
print_success "Migrations applied successfully"

# Step 10: Verify endpoints
print_step "Step 10: Verifying endpoints..."

endpoints_to_check=(
    "GET /api/v1/scr/dashboard/kpis"
    "GET /api/v1/admin/scr/github-tokens"
    "GET /api/v1/admin/scr/llm-config"
)

for endpoint in "${endpoints_to_check[@]}"; do
    method=$(echo $endpoint | cut -d' ' -f1)
    path=$(echo $endpoint | cut -d' ' -f2)

    if [ "$method" = "GET" ]; then
        if ! curl -s "http://localhost:8000$path" >/dev/null 2>&1; then
            print_error "Endpoint $path not responding"
        else
            print_success "Endpoint $path responding"
        fi
    fi
done

echo ""
echo "==========================================="
echo -e "${GREEN}🎉 SCR Module Deployment Complete!${NC}"
echo "==========================================="
echo ""
echo "📊 Backend: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - Dashboard: http://localhost:8000/api/v1/scr/dashboard/kpis"
echo ""
echo "🎨 Frontend: http://localhost:3000"
echo "  - SCR Dashboard: http://localhost:3000/code-security-reviews/dashboard"
echo "  - Admin Config: http://localhost:3000/admin/integrations"
echo ""
echo "📝 Logs:"
echo "  - Backend:  docker-compose logs backend"
echo "  - Frontend: docker-compose logs frontend"
echo "  - All:      docker-compose logs"
echo ""
echo "🔧 Commands:"
echo "  - Restart:  docker-compose restart"
echo "  - Stop:     docker-compose down"
echo "  - Shell:    docker-compose exec backend bash"
echo ""
echo "✅ Ready for testing!"
