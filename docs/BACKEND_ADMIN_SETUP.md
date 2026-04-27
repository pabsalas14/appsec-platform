# Backend Implementation Guide - Admin Pages (Fases 3-8)

## 🎯 Requisitos Backend

Para habilitar las 6 páginas admin en frontend, necesitas implementar estos endpoints en el backend.

---

## 📋 Checklist de Implementación

### 1. **ModuleViews**
- [ ] Modelo: `backend/app/models/module_view.py` (revisar si existe)
- [ ] Schema: `backend/app/schemas/module_view.py`
- [ ] Service: `backend/app/services/module_view.py`
- [ ] Router: `backend/app/api/v1/admin/module_views.py`
- [ ] Registrar router en `backend/app/api/v1/router.py`
- [ ] Migración: `docker compose exec backend alembic revision --autogenerate -m "add module_views"`

**Endpoints requeridos**:
```
GET    /api/v1/admin/module-views          (paginated, search)
POST   /api/v1/admin/module-views          (create)
PUT    /api/v1/admin/module-views/{id}     (update)
DELETE /api/v1/admin/module-views/{id}     (soft delete)
```

**Campos del modelo**:
```python
id: UUID
module_name: str
nombre: str
tipo: str (enum: table, kanban, calendar, cards)
columns_config: Optional[Text]  # JSON
filters: Optional[Text]         # JSON
created_at: datetime
updated_at: datetime
deleted_at: Optional[datetime]
deleted_by: Optional[UUID]      # FK to users.id
```

---

### 2. **CustomFields**
- [ ] Crear tabla `custom_fields` (si no existe como JSONB)
- [ ] Schema: `backend/app/schemas/custom_field.py`
- [ ] Service: `backend/app/services/custom_field.py`
- [ ] Router: `backend/app/api/v1/admin/custom_fields.py`
- [ ] Registrar en router.py

**Endpoints**:
```
GET    /api/v1/admin/custom-fields?entity_type=X  (paginated, filtrable)
POST   /api/v1/admin/custom-fields
PUT    /api/v1/admin/custom-fields/{id}
DELETE /api/v1/admin/custom-fields/{id}
```

**Campos**:
```python
id: UUID
entity_type: str (vulnerabilidad, iniciativa, auditoria, tema_emergente, proyecto)
nombre: str
tipo_campo: str (enum: string, number, boolean, date, json, enum)
required: bool (default: false)
validacion: Optional[dict]  # JSON schema
created_at: datetime
updated_at: datetime
deleted_at: Optional[datetime]
deleted_by: Optional[UUID]
```

---

### 3. **ValidationRules**
- [ ] Modelo: `backend/app/models/validation_rule.py`
- [ ] Schema: `backend/app/schemas/validation_rule.py`
- [ ] Service: `backend/app/services/validation_rule.py`
- [ ] Router: `backend/app/api/v1/admin/validation_rules.py`

**Endpoints**:
```
GET    /api/v1/admin/validation-rules        (paginated, search)
POST   /api/v1/admin/validation-rules        (create)
PUT    /api/v1/admin/validation-rules/{id}   (update)
DELETE /api/v1/admin/validation-rules/{id}   (soft delete)
POST   /api/v1/admin/validation-rules/{id}/test  (dry-run test)
```

**Campos**:
```python
id: UUID
entity_type: str
nombre: str
condition: Union[dict, str]  # JSON
rule_type: str (enum: required, regex, range, custom)
enabled: bool (default: true)
created_at: datetime
updated_at: datetime
deleted_at: Optional[datetime]
deleted_by: Optional[UUID]
```

**Test endpoint**:
```python
@router.post("/{id}/test")
async def test_validation_rule(
    id: UUID,
    request: TestCallRequest,  # { sample_data: dict }
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Ejecutar regla con sample_data
    # Retornar resultado del test
    pass
```

---

### 4. **Catalogs** (SystemCatalog)
- [ ] Modelo existente: `backend/app/models/system_catalog.py` ✓
- [ ] Schema existente: `backend/app/schemas/system_catalog.py` ✓
- [ ] Service: `backend/app/services/system_catalog.py` (crear si no existe)
- [ ] Router: `backend/app/api/v1/admin/catalogs.py` (crear si no existe)

**Nota**: El modelo ya existe. Solo necesita service + router + migration.

**Endpoints**:
```
GET    /api/v1/admin/catalogs           (paginated, search)
POST   /api/v1/admin/catalogs           (create)
PUT    /api/v1/admin/catalogs/{id}      (update)
DELETE /api/v1/admin/catalogs/{id}      (soft delete)
```

**Campos esperados** (ajustar a modelo actual):
```python
id: UUID
tipo: str
key: str
values: dict  # JSONB
activo: bool
descripcion: Optional[str]
deleted_at: Optional[datetime]
deleted_by: Optional[UUID]
```

---

### 5. **NavigationItems**
- [ ] Modelo: `backend/app/models/navigation_item.py` (crear)
- [ ] Schema: `backend/app/schemas/navigation_item.py`
- [ ] Service: `backend/app/services/navigation_item.py`
- [ ] Router: `backend/app/api/v1/admin/navigation.py`

**Endpoints**:
```
GET    /api/v1/admin/navigation              (paginated, search, tree?)
POST   /api/v1/admin/navigation              (create)
PUT    /api/v1/admin/navigation/{id}         (update)
DELETE /api/v1/admin/navigation/{id}         (soft delete)
PATCH  /api/v1/admin/navigation/{id}/reorder (cambiar orden)
```

**Campos**:
```python
id: UUID
label: str
icon: Optional[str]
href: Optional[str]
orden: int
visible: bool (default: true)
required_role: Optional[str]
parent_id: Optional[UUID]  # FK to self
created_at: datetime
updated_at: datetime
deleted_at: Optional[datetime]
deleted_by: Optional[UUID]
```

---

### 6. **AIRules**
- [ ] Modelo: `backend/app/models/ai_rule.py` (crear)
- [ ] Schema: `backend/app/schemas/ai_rule.py`
- [ ] Service: `backend/app/services/ai_rule.py`
- [ ] Router: `backend/app/api/v1/admin/ai_rules.py`

**Endpoints**:
```
GET    /api/v1/admin/ai-rules              (paginated, search)
POST   /api/v1/admin/ai-rules              (create)
PUT    /api/v1/admin/ai-rules/{id}         (update)
DELETE /api/v1/admin/ai-rules/{id}         (soft delete)
POST   /api/v1/admin/ai-rules/{id}/dry-run (test sin ejecutar)
```

**Campos**:
```python
id: UUID
nombre: str
trigger_type: str (enum: event, schedule, manual)
trigger_config: dict  # JSONB
action_type: str (enum: create, update, notify, execute)
action_config: dict  # JSONB
enabled: bool (default: true)
created_at: datetime
updated_at: datetime
deleted_at: Optional[datetime]
deleted_by: Optional[UUID]
```

---

## 🔧 Patrón de Implementación Base

### Modelo (SQLAlchemy)
```python
from app.models.mixins import SoftDeleteMixin, TimestampMixin
from sqlalchemy import String, Text
from uuid import UUID, uuid4

class MyEntity(TimestampMixin, SoftDeleteMixin):
    __tablename__ = "my_entities"
    
    id = Column(UUID, primary_key=True, default=uuid4)
    nombre = Column(String(255), nullable=False)
    # ... más campos
```

### Schema (Pydantic)
```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MyEntityCreate(BaseModel):
    nombre: str
    # ... campos sin id, timestamps

class MyEntityUpdate(BaseModel):
    nombre: Optional[str] = None
    # ... campos opcionales

class MyEntityRead(BaseModel):
    id: UUID
    nombre: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[UUID] = None
```

### Service (BaseService)
```python
from app.services.base import BaseService
from app.models.my_entity import MyEntity
from app.schemas.my_entity import MyEntityCreate, MyEntityUpdate

service = BaseService[MyEntity, MyEntityCreate, MyEntityUpdate](
    MyEntity,
    owner_field=None,  # o "user_id" si es propiedad del usuario
    audit_action_prefix="my_entity"
)
```

### Router
```python
from fastapi import APIRouter, Depends, Query
from app.deps import get_current_user, require_role
from app.core.response import success, paginated, error
from app.database import get_db

router = APIRouter(prefix="/admin/my-entity", tags=["admin"])

@router.get("")
async def list_entities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db = Depends(get_db),
    current_user = Depends(require_role("admin"))
):
    # Implementar lógica de listado con paginación y búsqueda
    total = await service.count(db, skip_deleted=True)
    items = await service.list(db, skip=(page-1)*page_size, limit=page_size)
    return paginated(items, page=page, page_size=page_size, total=total)

@router.post("")
async def create_entity(data: MyEntityCreate, db = Depends(get_db), current_user = Depends(require_role("admin"))):
    item = await service.create(db, data, created_by=current_user.id)
    return success(item)

@router.put("/{id}")
async def update_entity(id: UUID, data: MyEntityUpdate, db = Depends(get_db), current_user = Depends(require_role("admin"))):
    item = await service.update(db, id, data)
    return success(item)

@router.delete("/{id}")
async def delete_entity(id: UUID, db = Depends(get_db), current_user = Depends(require_role("admin"))):
    await service.delete(db, id, deleted_by=current_user.id)
    return success({"deleted": True})
```

---

## 🚀 Orden Recomendado de Implementación

1. **Catalogs** (modelo ya existe)
2. **ModuleViews** (ya existe modelo, solo schema/service/router)
3. **CustomFields** (tabla nueva)
4. **NavigationItems** (tabla nueva)
5. **ValidationRules** (tabla nueva)
6. **AIRules** (tabla nueva)

---

## 🧪 Testing Backend

Después de cada implementación:

```bash
# Generar migrations
docker compose exec backend alembic revision --autogenerate -m "add <entity>"
docker compose exec backend alembic upgrade head

# Ejecutar tests
make test

# Verificar nuevo endpoint
curl -X GET http://localhost:8000/api/v1/admin/<entity> \
  -H "Authorization: Bearer <token>"
```

---

## ✅ Pre-requisitos para Frontend

- [ ] Todos los endpoints responden con estructura: `{ data: [], total: N }`
- [ ] Soft delete funciona (deleted_at se popula)
- [ ] Búsqueda filtra por nombre/título/label
- [ ] Paginación funciona (page, page_size parámetros)
- [ ] `require_role("admin")` protege todos los endpoints

