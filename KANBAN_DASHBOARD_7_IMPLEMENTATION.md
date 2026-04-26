# Dashboard 7: Kanban de Liberaciones — Guía de Implementación Completa

## ✅ Completado

Este documento detalla la implementación 100% funcional del Dashboard 7 (Kanban de Liberaciones).

### 📊 Endpoints Implementados

#### 1. GET /api/v1/dashboard/release-kanban-columns
**Descripción:** Obtiene las 8 columnas configuradas del kanban.

**Response:**
```json
{
  "code": 200,
  "data": [
    {
      "id": "uuid",
      "nombre": "Borrador",
      "color": "#6b7280",
      "icono": "file-text",
      "orden": 1,
      "estado_correspondiente": "Borrador",
      "descripcion": "Release en etapa de redacción inicial",
      "created_at": "2026-04-25T...",
      "updated_at": "2026-04-25T..."
    },
    ...
  ]
}
```

#### 2. GET /api/v1/dashboard/releases-kanban
**Descripción:** Obtiene todos los releases agrupados por columna (estado).

**Response:**
```json
{
  "code": 200,
  "data": {
    "columnas": [
      {
        "id": "uuid",
        "nombre": "Borrador",
        "color": "#6b7280",
        "estado_correspondiente": "Borrador",
        "releases": [
          {
            "id": "uuid",
            "nombre": "Release v1.0",
            "version": "1.0.0",
            "estado_actual": "Borrador",
            "servicio_id": "uuid",
            "servicio_nombre": "API Gateway",
            "user_id": "uuid",
            "created_at": "2026-04-25T...",
            "updated_at": "2026-04-25T...",
            "etapas_count": 5,
            "etapas_completadas": 2
          }
        ],
        "release_count": 1,
        "orden": 1
      }
    ],
    "total_releases": 10,
    "metadata": {
      "ultima_actualizacion": "2026-04-25T...",
      "estados_validos": ["Borrador", "En Revision de Diseno", ...]
    }
  }
}
```

#### 3. PATCH /api/v1/dashboard/service-releases/{id}/move
**Descripción:** Mueve un release a otra columna (drag-drop). Aplica validación de SoD.

**Request:**
```json
{
  "column_id": "uuid-of-target-column",
  "nueva_etapa": "En Produccion",
  "notas": "Movido a producción"
}
```

**Response:**
```json
{
  "code": 200,
  "data": {
    "id": "uuid",
    "nombre": "Release v1.0",
    "version": "1.0.0",
    "estado_actual": "En Produccion",
    "servicio_id": "uuid",
    "user_id": "uuid",
    "created_at": "2026-04-25T...",
    "updated_at": "2026-04-25T..."
  }
}
```

---

## 🎨 8 Columnas Configurables

| Orden | Nombre | Color | Estado Correspondiente | Descripción |
|-------|--------|-------|----------------------|-------------|
| 1 | Borrador | #6b7280 | Borrador | Redacción inicial |
| 2 | En Revisión de Diseño | #3b82f6 | En Revision de Diseno | Revisión arquitectónica |
| 3 | En Validación de Seguridad | #8b5cf6 | En Validacion de Seguridad | Validación seguridad |
| 4 | Con Observaciones | #f59e0b | Con Observaciones | Observaciones pendientes |
| 5 | En Pruebas de Seguridad | #ec4899 | En Pruebas de Seguridad | Ejecución de pruebas |
| 6 | Pendiente Aprobación | #f97316 | Pendiente Aprobación | Esperando aprobación |
| 7 | En QA | #06b6d4 | En QA | En ambiente QA |
| 8 | En Producción | #10b981 | En Produccion | Deployed en producción |

---

## 🚀 Frontend Componentes

### ReleaseKanbanBoard
Componente principal que:
- Carga datos del kanban desde backend
- Implementa DnD con @dnd-kit/core
- Maneja transiciones entre columnas
- Valida SoD en backend antes de mover

### ReleaseKanbanColumn
Columna individual con:
- Indicador de estado (color + nombre)
- Contador de releases
- Área de drop para recibir releases

### ReleaseKanbanCard
Tarjeta de release con:
- Nombre + versión
- Barra de progreso de etapas
- Info del servicio
- Handle de drag

---

## 🔐 Validaciones

1. **SoD (Segregation of Duties):** El endpoint PATCH valida que el usuario que mueve el release cumpla con las reglas de SoD configuradas.

2. **Permisos:** Todos los endpoints requieren autenticación con `require_permission(P.DASHBOARDS.VIEW)` y `require_permission(P.RELEASES.UPDATE)`.

3. **Existencia:** Se valida que:
   - El release existe
   - La columna destino existe
   - El estado destino es válido

---

## 📦 Instalación & Testing

### 1. Ejecutar migraciones
```bash
docker compose exec backend alembic upgrade head
```

### 2. Ejecutar seed
```bash
make seed
# o
docker compose exec backend python -m app.seed
```

### 3. Testear endpoints
```bash
# Obtener columnas
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/dashboard/release-kanban-columns

# Obtener releases kanban
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/dashboard/releases-kanban

# Mover release
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"column_id":"<uuid>","nueva_etapa":"En Produccion"}' \
  http://localhost:8000/api/v1/dashboard/service-releases/<release-id>/move
```

### 4. Testear en frontend
- Navigate to: `/dashboards/kanban`
- Verificar que carga las 8 columnas
- Drag-drop un release entre columnas
- Verificar que se actualiza en tiempo real

---

## 🏗️ Estructura de Archivos

### Backend
```
backend/
  app/
    models/kanban_column.py          # Modelo BD
    schemas/kanban_release.py        # Schemas Pydantic
    services/kanban_column_service.py # CRUD service
    api/v1/dashboard.py              # 3 endpoints
  alembic/versions/
    g1h2i3j4k5l6_add_kanban_columns.py  # Migración
  app/seed.py                         # Seeds iniciales

frontend/
  src/
    components/kanban/
      ReleaseKanbanBoard.tsx          # Componente principal
      ReleaseKanbanColumn.tsx         # Columnas
      ReleaseKanbanCard.tsx           # Tarjetas
    app/(dashboard)/dashboards/kanban/
      page.tsx                        # Página del dashboard
```

---

## ✨ Features

- ✅ 8 columnas configurables con colores e íconos
- ✅ Drag-drop funcional con @dnd-kit
- ✅ Barra de progreso de etapas en cada tarjeta
- ✅ Info del servicio en tarjetas
- ✅ Validación de SoD en movimientos
- ✅ Loading states y error handling
- ✅ Responsive design
- ✅ Actualizaciones en tiempo real

---

## 🔧 Troubleshooting

### Las columnas no aparecen
1. Verificar que la migración se ejecutó: `docker compose exec db psql -U user -d appsec -c "SELECT * FROM kanban_columns;"`
2. Ejecutar seed nuevamente: `make seed`

### El drag-drop no funciona
1. Verificar que @dnd-kit está instalado: `npm list @dnd-kit/core`
2. Verificar consola del navegador por errores

### El endpoint retorna 403
1. Verificar que el usuario tiene permiso P.DASHBOARDS.VIEW
2. Verificar token JWT válido

---

**Dashboard 7 — Kanban de Liberaciones: 100% COMPLETADO** ✅
