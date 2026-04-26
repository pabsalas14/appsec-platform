#!/bin/bash
# FASE 3 - Quick Validation Script
# Uso: bash VALIDATION_QUICK.sh

set -e

echo "🚀 FASE 3 - Module View Builder | Validación Rápida"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde /Users/pablosalas/Appsec/appsec-platform${NC}"
    exit 1
fi

echo -e "${YELLOW}1. Verificando servicios...${NC}"
BACKEND=$(docker compose ps backend --format "{{.State}}" 2>/dev/null || echo "")
FRONTEND=$(docker compose ps frontend --format "{{.State}}" 2>/dev/null || echo "")

if [[ "$BACKEND" == *"running"* && "$FRONTEND" == *"running"* ]]; then
    echo -e "${GREEN}✅ Backend y Frontend están corriendo${NC}"
else
    echo -e "${YELLOW}⚠️  Servicios no están corriendo. Iniciando...${NC}"
    docker compose up -d
    sleep 10
fi

echo ""
echo -e "${YELLOW}2. Verificando endpoints backend...${NC}"
RESPONSE=$(curl -s http://localhost:8000/api/v1/ || echo '{}')
if [[ "$RESPONSE" == *"status"* ]]; then
    echo -e "${GREEN}✅ Backend respondiendo en http://localhost:8000/api/v1/${NC}"
else
    echo -e "${RED}❌ Backend no responde. Espera 30s...${NC}"
    sleep 30
fi

echo ""
echo -e "${YELLOW}3. Verificando archivo admin page...${NC}"
if [ -f "frontend/src/app/(dashboard)/admin/module-views/page.tsx" ]; then
    echo -e "${GREEN}✅ Admin page existe${NC}"
    LINES=$(wc -l < "frontend/src/app/(dashboard)/admin/module-views/page.tsx")
    echo "   → $LINES líneas de código"
else
    echo -e "${RED}❌ Admin page no encontrada${NC}"
fi

echo ""
echo -e "${YELLOW}4. Verificando hooks...${NC}"
if [ -f "frontend/src/hooks/useModuleViews.ts" ]; then
    echo -e "${GREEN}✅ Hooks implementados${NC}"
    FUNCTIONS=$(grep -c "export function use" frontend/src/hooks/useModuleViews.ts)
    echo "   → $FUNCTIONS funciones export"
else
    echo -e "${RED}❌ Hooks no encontrados${NC}"
fi

echo ""
echo -e "${YELLOW}5. Verificando schemas backend...${NC}"
if grep -q "class ModuleViewRead" backend/app/schemas/module_view.py; then
    echo -e "${GREEN}✅ Schemas Pydantic configurados${NC}"
    SCHEMAS=$(grep "^class Module" backend/app/schemas/module_view.py | wc -l)
    echo "   → $SCHEMAS schemas definidos"
else
    echo -e "${RED}❌ Schemas no encontrados${NC}"
fi

echo ""
echo -e "${YELLOW}6. Verificando endpoints en router...${NC}"
if grep -q "@router.get\|@router.post\|@router.patch\|@router.delete" backend/app/api/v1/admin/module_views.py; then
    echo -e "${GREEN}✅ 5 Endpoints implementados${NC}"
    ENDPOINTS=$(grep -c "@router\." backend/app/api/v1/admin/module_views.py)
    echo "   → $ENDPOINTS decoradores de ruta"
else
    echo -e "${RED}❌ Endpoints no encontrados${NC}"
fi

echo ""
echo -e "${YELLOW}7. URLs de Acceso${NC}"
echo "   Backend API: http://localhost:8000/api/v1/admin/module-views"
echo "   Admin Page:  http://localhost:3000/admin/module-views"
echo "   Swagger:     http://localhost:8000/docs"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Validación Completada${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Navega a http://localhost:3000"
echo "2. Login como admin"
echo "3. Vay a Admin → Module Views"
echo "4. Click 'New View' para crear una vista"
echo "5. Completa el formulario y verifica que funciona"
echo ""
echo "Para más detalles, revisar:"
echo "  - docs/FASE_3_MODULE_VIEW_BUILDER.md"
echo "  - VALIDATION_FASE_3.md"
echo "  - FASE_3_ENTREGA_FINAL.md"
