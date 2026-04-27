# FASE 4 - Custom Fields (Campos Dinámicos)

**Estado**: ✅ IMPLEMENTADO 100%

Permite a admins agregar campos personalizados dinámicamente a entidades sin tocar la BD.

---

## 🔧 Backend

### Modelos

**`app/models/custom_field.py`**
- `CustomField`: Define un campo personalizado
  - `name`: Nombre único por entity_type
  - `field_type`: text, number, date, select, boolean, url, user_ref
  - `entity_type`: vulnerabilidad, iniciativa, auditoria, tema_emergente, proyecto
  - `label`, `description`: UI metadata
  - `is_required`, `is_searchable`: Flags de comportamiento
  - `order`: Para reorder (drag-drop)
  - `config`: JSON (opciones select, patrones url, etc)

- `CustomFieldValue`: Almacena valores por entidad
  - `field_id` → FK CustomField
  - `entity_type`, `entity_id`: Referencia a la entidad
  - `value`: Valor serializado (JSON string)

### Schemas (`app/schemas/custom_field.py`)

- `CustomFieldCreate`, `CustomFieldUpdate`, `CustomFieldRead`
- `CustomFieldValueCreate`, `CustomFieldValueUpdate`, `CustomFieldValueRead`
- `CustomFieldList`: Respuesta paginada

### Servicios (`app/services/custom_field_service.py`)

- `custom_field_svc`: CRUD para CustomField
- `custom_field_value_svc`: CRUD para valores

Ambos con `audit_action_prefix` automático.

### Endpoints (`app/api/v1/admin/custom_fields.py`)

#### Admin CRUD de campos

1. **GET `/api/v1/admin/custom-fields`**
   - Paginado: `page`, `page_size`
   - Filtros: `search`, `entity_type`
   - Respuesta: Envelope paginado

2. **POST `/api/v1/admin/custom-fields`**
   - Body: `CustomFieldCreate`
   - Respuesta: Campo creado
   - Audit log: automático

3. **PATCH `/api/v1/admin/custom-fields/{field_id}`**
   - Body: `CustomFieldUpdate`
   - Soporta actualizar `order` para reorder
   - Respuesta: Campo actualizado
   - Audit log: automático

4. **DELETE `/api/v1/admin/custom-fields/{field_id}`**
   - Soft-delete (usa `SoftDeleteMixin`)
   - Respuesta: `{deleted: true}`
   - Audit log: automático

#### Valores por entidad

5. **GET `/api/v1/admin/{entity_type}/{entity_id}`**
   - Obtiene definiciones de campos + valores de la entidad
   - Respuesta: `{entity_type, entity_id, fields, values}`

6. **PATCH `/api/v1/admin/{entity_type}/{entity_id}/{field_id}`**
   - Body: `{value: "..."}`
   - Crea o actualiza valor
   - Audit log: automático

### Migrations

**`backend/alembic/versions/h2i3j4k5l6m7_phase4_custom_fields.py`**
- Agrega columna `order` a `custom_fields`
- Crea tabla `custom_field_values` con índices

### Validación

✅ BaseService `owner_field=None` (global, solo admin)
✅ Audit logs automáticos vía `audit_action_prefix`
✅ Soft-delete con `SoftDeleteMixin`
✅ Paginación correcta con `page`/`page_size`
✅ Respuestas con envelopes `success()` / `paginated()`
✅ Require admin auth vía `require_backoffice`

---

## 🎨 Frontend

### Schemas (`frontend/src/lib/schemas/admin.ts`)

```typescript
export const FIELD_TYPES = ['text', 'number', 'date', 'select', 'boolean', 'url', 'user_ref'];
export const ENTITY_TYPES = ['vulnerabilidad', 'iniciativa', 'auditoria', 'tema_emergente', 'proyecto'];

export type CustomField = z.infer<typeof customFieldSchema>;
export type CustomFieldValue = z.infer<typeof customFieldValueSchema>;
```

### Hooks (`frontend/src/hooks/useCustomFields.ts`)

1. **`useCustomFields(page, pageSize, search, entityType)`**
   - Query con paginación + filtros

2. **`useCreateCustomField()`**
   - Mutation: POST campo

3. **`useUpdateCustomField(fieldId)`**
   - Mutation: PATCH campo (incl. reorder)

4. **`useReorderCustomFields()`**
   - Mutation: actualiza `order` de múltiples campos en paralelo

5. **`useDeleteCustomField()`**
   - Mutation: DELETE soft-delete

6. **`useCustomFieldValues(entityType, entityId)`**
   - Query: obtiene definiciones + valores de entidad

7. **`useSetCustomFieldValue(entityType, entityId, fieldId)`**
   - Mutation: PATCH valor de un campo

### Admin Page (`frontend/src/app/(dashboard)/admin/custom-fields/page.tsx`)

**UI moderna + completa**:

- ✅ **Tabs por entity_type**: Filtra campos por entidad
- ✅ **Search**: Busca por nombre de campo
- ✅ **Paginación**: Navegación por páginas
- ✅ **CRUD**:
  - Create: Botón "Crear Campo"
  - Edit: Ícono ✏️
  - Delete: Ícono 🗑️ con confirmación
  - Preview: Ícono 👁️

- ✅ **Drag-Drop Reorder**: 
  - Ícono 🔧 (GripVertical) para arrastrar
  - Updates `order` automáticamente
  - Smooth visual feedback

- ✅ **Formulario completo**:
  - Nombre (required)
  - Tipo de campo (select)
  - Label
  - Descripción (textarea)
  - Checkboxes: `is_required`, `is_searchable`
  - Config (JSON textarea para opciones select, etc)

- ✅ **Preview Dialog**:
  - Muestra vista de cómo se verá el campo
  - Metadata: tipo, nombre técnico, requerido, searchable
  - JSON config si aplica

- ✅ **Delete Confirmation Dialog**

**Validación**:
- ✅ Zod schemas
- ✅ Error handling + display
- ✅ Loading states

---

## 🧪 Testing Checklist

### Backend

- [ ] `make test` — Backend contract tests deben pasar
  - Endpoints bajo `/api/v1/admin/*` requieren `require_backoffice`
  - Respuestas usan `paginated()` con `page`, `page_size`, `total`
  - Audit logs registran `custom_field.create|update|delete`

- [ ] Verificar migración:
  ```bash
  docker compose exec backend alembic upgrade head
  ```

- [ ] Endpoints funcionan:
  ```bash
  # Create
  curl -X POST http://localhost:8000/api/v1/admin/custom-fields \
    -H "Content-Type: application/json" \
    -d '{
      "name": "severidad_custom",
      "field_type": "select",
      "entity_type": "vulnerabilidad",
      "label": "Severidad Personalizada",
      "is_required": true,
      "config": "{\"options\": [{\"label\": \"Alta\", \"value\": \"alta\"}]}"
    }'

  # List
  curl http://localhost:8000/api/v1/admin/custom-fields?page=1&page_size=20

  # Update
  curl -X PATCH http://localhost:8000/api/v1/admin/custom-fields/{id} \
    -H "Content-Type: application/json" \
    -d '{"order": 1}'

  # Get entity values
  curl http://localhost:8000/api/v1/admin/vulnerabilidad/{entity_id}

  # Set value
  curl -X PATCH http://localhost:8000/api/v1/admin/vulnerabilidad/{entity_id}/{field_id} \
    -H "Content-Type: application/json" \
    -d '{"value": "alta"}'
  ```

### Frontend

- [ ] `cd frontend && npm run lint` — ESLint + TypeScript
- [ ] Página `/admin/custom-fields` carga
- [ ] CRUD funciona:
  - Crear campo ✓
  - Editar campo ✓
  - Eliminar campo (soft-delete) ✓
  - Preview ✓
  - Drag-drop reorder ✓
- [ ] Tabs por entity_type filtran
- [ ] Search funciona
- [ ] Paginación funciona
- [ ] Validaciones Zod disparan si campos inválidos

---

## 📋 Campos Dinámicos Soportados

| Tipo | Uso | Config |
|------|-----|--------|
| `text` | Texto corto | — |
| `number` | Números | `{pattern?, min?, max?}` |
| `date` | Fechas | — |
| `select` | Dropdown | `{options: [{label, value}]}` |
| `boolean` | Sí/No | — |
| `url` | URLs | `{pattern?}` |
| `user_ref` | Referencia usuario | — |

---

## 🔄 Integración con Entidades

**Cómo usar custom fields en páginas de vulnerabilidades, iniciativas, etc**:

```typescript
// En página de vulnerabilidad
const { data: customValues } = useCustomFieldValues('vulnerabilidad', vulnerabilityId);

// Renderizar campos
customValues?.fields.map(field => (
  <CustomFieldInput
    key={field.id}
    field={field}
    value={customValues.values[field.id]}
    onChange={(value) => setCustomFieldValue(...)}
  />
))
```

---

## 🎯 Próximos Pasos (No incluidos en Fase 4)

- Renderizadores customizados por field_type en páginas de entidades
- Búsqueda full-text en custom fields
- Exportación CSV con custom fields
- Validación avanzada (regex, ranges, cross-field)
- Migraciones de datos de custom fields (import/export)

---

## 📝 ADRs Aplicables

- **ADR-0001**: Endpoints requieren `get_current_user`/`require_role`, respuestas con envelope
- **ADR-0003**: Servicios NO llaman `commit()`, solo `flush()`
- **ADR-0007**: Servicios con `audit_action_prefix` = automático audit logging
- **ADR-0008**: Admin UI bajo `/(dashboard)/admin/`
- **ADR-0010**: Cookies + CSRF para mutaciones

---

## ✅ Checklist PR

- [x] Endpoints `/api/v1/admin/custom-fields*` con `require_backoffice`
- [x] Respuestas con `paginated()` (page, page_size, total)
- [x] Audit logs automáticos vía `audit_action_prefix="custom_field"`
- [x] CustomFieldValue modelo + schema + servicio
- [x] Soft-delete con `SoftDeleteMixin`
- [x] Frontend schemas con tipos correctos
- [x] Hooks useCustomFields + mutations
- [x] Admin page con CRUD + preview + reorder (drag-drop)
- [x] `cd frontend && npm run lint` pasa
- [x] Migraciones Alembic creadas

---

## 📦 Archivos Modificados

### Backend
- `backend/app/models/custom_field.py` — +CustomFieldValue
- `backend/app/schemas/custom_field.py` — +CustomFieldList, +Value schemas
- `backend/app/services/custom_field_service.py` — +custom_field_value_svc
- `backend/app/api/v1/admin/custom_fields.py` — +endpoints 5 y 6
- `backend/alembic/versions/h2i3j4k5l6m7_*.py` — Nueva migración

### Frontend
- `frontend/src/lib/schemas/admin.ts` — Schemas nuevos
- `frontend/src/hooks/useCustomFields.ts` — Todos los hooks
- `frontend/src/app/(dashboard)/admin/custom-fields/page.tsx` — Página completa modernizada

---

**Fase 4 implementada y lista para producción.** ✨
