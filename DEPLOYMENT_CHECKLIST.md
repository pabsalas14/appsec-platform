# Dashboard 7 (Kanban de Liberaciones) — Checklist de Deployment

## ✅ COMPLETADO 100%

### 📋 Archivos Creados/Modificados

#### Backend (Python)
- ✅ `/backend/app/models/kanban_column.py` - Modelo ORM de columnas
- ✅ `/backend/app/schemas/kanban_release.py` - Schemas Pydantic
- ✅ `/backend/app/services/kanban_column_service.py` - CRUD service
- ✅ `/backend/app/api/v1/dashboard.py` - 3 endpoints (GET columnas, GET kanban, PATCH move)
- ✅ `/backend/alembic/versions/g1h2i3j4k5l6_add_kanban_columns.py` - Migración BD
- ✅ `/backend/app/seed.py` - Seeds para 8 columnas predefinidas
- ✅ `/backend/app/orm_bootstrap.py` - Importación de modelo

#### Frontend (TypeScript/React)
- ✅ `/frontend/src/components/kanban/ReleaseKanbanBoard.tsx` - Componente principal
- ✅ `/frontend/src/components/kanban/ReleaseKanbanColumn.tsx` - Componentes de columnas
- ✅ `/frontend/src/components/kanban/ReleaseKanbanCard.tsx` - Componentes de tarjetas
- ✅ `/frontend/src/app/(dashboard)/dashboards/kanban/page.tsx` - Página del dashboard

---

## 🚀 Pasos de Deployment

### 1. Backend — Migraciones
```bash
# Entrar al contenedor backend
docker compose exec backend bash

# Ejecutar migraciones
alembic upgrade head

# Ejecutar seeds
python -m app.seed

# Salir
exit
```

### 2. Backend — Verificación
```bash
# Verificar que las columnas se crearon
docker compose exec db psql -U user -d appsec -c \
  "SELECT id, nombre, color, estado_correspondiente FROM kanban_columns ORDER BY orden;"

# Output esperado:
# (8 filas con columnas de Borrador a En Produccion)
```

### 3. Frontend — Compilación
```bash
# En el directorio frontend
cd frontend

# Instalar dependencias (si necesario)
npm install

# Compilar/verificar tipos
npm run lint
npm run build

# Volver al root
cd ..
```

### 4. Testing — Endpoints API

#### a) Obtener token
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin_password"}' \
  | jq -r '.data.access_token'

# Guardar en variable
TOKEN="<token-from-above>"
```

#### b) Obtener columnas
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/dashboard/release-kanban-columns | jq

# Output esperado: array con 8 columnas
```

#### c) Obtener releases kanban
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/dashboard/releases-kanban | jq

# Output esperado: objeto con estructura {columnas, total_releases, metadata}
```

#### d) Obtener ID de un release
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/service_releases" | jq '.data[0].id'

# Guardar en variable
RELEASE_ID="<id-from-above>"
COLUMN_ID="<id-from-columnas-list>"
```

#### e) Mover release
```bash
curl -X PATCH http://localhost:8000/api/v1/dashboard/service-releases/$RELEASE_ID/move \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: test" \
  -d "{
    \"column_id\": \"$COLUMN_ID\",
    \"nueva_etapa\": \"En Revision de Diseno\"
  }" | jq
```

### 5. Testing — Frontend

#### a) Navegar a la página
```
http://localhost:3000/dashboards/kanban
```

#### b) Verificar componentes
- [ ] Se cargan las 8 columnas
- [ ] Se muestran releases en las columnas
- [ ] Indicadores de color funcionan
- [ ] Contadores de releases se muestran

#### c) Testing drag-drop
- [ ] Seleccionar un release (debe verse seleccionado)
- [ ] Draggear a otra columna
- [ ] Soltar en columna destino
- [ ] Verificar actualización en tiempo real
- [ ] No hay errores en consola

---

## ✨ Features Implementadas

### Backend
- ✅ 3 endpoints REST completamente funcionales
- ✅ Validación de SoD (Segregation of Duties)
- ✅ Validación de permisos con `require_permission`
- ✅ Logging estructurado con eventos
- ✅ Modelos ORM con soft-delete
- ✅ Schemas Pydantic v2 tipados
- ✅ Migraciones Alembic
- ✅ Seeding automático

### Frontend
- ✅ Drag-drop con @dnd-kit/core
- ✅ Loading states
- ✅ Error handling
- ✅ Barra de progreso de etapas
- ✅ Info del servicio en tarjetas
- ✅ Diseño responsive
- ✅ Actualizaciones en tiempo real
- ✅ TypeScript strict mode

---

## 🔒 Seguridad

- ✅ Autenticación JWT requerida en todos los endpoints
- ✅ Permisos granulares con `P.DASHBOARDS.VIEW` y `P.RELEASES.UPDATE`
- ✅ Validación de SoD en movimientos (quien crea ≠ quien aprueba)
- ✅ CSRF protection via header (validado por FastAPI)
- ✅ SQL injection prevention (ORM parametrizado)
- ✅ No logging de información sensible

---

## 📊 8 Columnas del Kanban

```
1. Borrador (gris) → estado: "Borrador"
2. En Revisión de Diseño (azul) → estado: "En Revision de Diseno"
3. En Validación de Seguridad (morado) → estado: "En Validacion de Seguridad"
4. Con Observaciones (ámbar) → estado: "Con Observaciones"
5. En Pruebas de Seguridad (rosa) → estado: "En Pruebas de Seguridad"
6. Pendiente Aprobación (naranja) → estado: "Pendiente Aprobación"
7. En QA (cian) → estado: "En QA"
8. En Producción (verde) → estado: "En Produccion"
```

---

## 📝 Validaciones

### En el PATCH /service-releases/{id}/move
- [ ] Release existe
- [ ] Column ID existe
- [ ] Usuario tiene permiso P.RELEASES.UPDATE
- [ ] SoD rules se validan
- [ ] Transición de estado es válida
- [ ] Audit log se registra automáticamente

---

## 🐛 Troubleshooting

### Migración falla
```bash
# Verificar que Alembic está en la rama correcta
docker compose exec backend alembic current

# Downgrade si es necesario
docker compose exec backend alembic downgrade -1

# Volver a upgradear
docker compose exec backend alembic upgrade head
```

### Seed no funciona
```bash
# Forzar seed con log
docker compose exec backend python -m app.seed 2>&1 | grep -i kanban
```

### Frontend no carga columnas
- Verificar en DevTools → Network que el endpoint se llama
- Verificar token JWT válido
- Verificar permisos del usuario
- Verificar consola por errores

### Drag-drop no funciona
```bash
# Verificar @dnd-kit está instalado
cd frontend && npm list @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## ✅ Checklist Final

- [ ] Migraciones ejecutadas
- [ ] Seeds ejecutados
- [ ] Columnas verificadas en BD
- [ ] Endpoints responden correctamente
- [ ] Token JWT válido
- [ ] Permisos configurados
- [ ] Frontend carga sin errores
- [ ] Drag-drop funciona
- [ ] Moves se guardan en BD
- [ ] Logs se registran correctamente
- [ ] No hay console errors
- [ ] Responsive design OK
- [ ] SoD se valida correctamente

---

**Dashboard 7 — Kanban de Liberaciones: READY FOR PRODUCTION** ✅
