# 🏗️ COMPLETE SPECIFICATION - DEVELOPMENT FRAMEWORK

## 1. VISION AND PURPOSE

This framework is a **production-ready full-stack starter kit** designed to:
- Accelerate development of new projects
- Maintain architectural consistency between frontend and backend
- Provide scalable and maintainable patterns
- Guarantee type-safety across the entire stack
- Reduce boilerplate and repetitive decisions

**What it solves:**
- Eliminates initial setup (auth, DB, Docker, CI/CD)
- Defines clear and reusable patterns
- Standardizes frontend↔backend communication
- Provides examples (Tasks module) to copy and adapt

**Who benefits:**
- Development teams working on multiple projects
- Startups that need a fast MVP
- Agencies that reuse their stack

**Out of scope:**
- Mobile apps (web only)
- Real-time (WebSockets can be added later)
- Microservices (monolith is simpler)

---

## 2. CORE PRINCIPLES

These principles guide ALL design decisions:

1. **Type-Safety End-to-End**
   - Backend: Pydantic schemas for ALL inputs
   - Frontend: Strict TypeScript everywhere
   - Automatic type synchronization where possible
   - Never use `any` without justification

2. **DRY (Don't Repeat Yourself)**
   - Don't duplicate validation (frontend + backend)
   - Don't duplicate types (use one as the source of truth)
   - Don't duplicate business logic
   - If you repeat code 2x, refactor

3. **Convention over Configuration**
   - Predictable and consistent structure
   - Clear and normalized names
   - Patterns that "feel" obvious
   - Minimal ad-hoc decisions

4. **API-First Design**
   - Backend is an API that could serve multiple clients
   - Standardized responses (status, data, error)
   - API versioning (/api/v1/)
   - Clear contracts

5. **Async by Default**
   - Backend: SQLAlchemy Async + FastAPI async
   - Frontend: Asynchronous queries/mutations
   - Explicit handling of loading/error states

6. **Failing Fast**
   - Validate as early as possible
   - Clear and specific errors
   - Exhaustive logging in production
   - Don't hide errors

7. **Scalability-First**
   - DB indexes from the start
   - Pagination on lists
   - Cache with TanStack Query
   - Modular structure

---

## 3. GENERAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                          USER                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
    ┌───▼─────────────┐        ┌─────▼──────────────┐
    │   FRONTEND      │        │     API DOCS       │
    │   Next.js       │───────▶│   Swagger/Redoc    │
    │   App Router    │        │   (/docs)          │
    │   TypeScript    │        └────────────────────┘
    │   Tailwind+UI   │
    │   TanStack Query│
    └───┬─────────────┘
        │ HTTP/JSON
        │ (REST API)
        │
    ┌───▼──────────────────────────────┐
    │      BACKEND                     │
    │      FastAPI                     │
    │  ┌───────────────────────────┐  │
    │  │ Routers (API endpoints)   │  │
    │  │ - auth.py                 │  │
    │  │ - tasks.py                │  │
    │  └───────────┬───────────────┘  │
    │              │                   │
    │  ┌───────────▼───────────────┐  │
    │  │ Services (Business Logic) │  │
    │  │ - auth_service.py         │  │
    │  │ - task_service.py         │  │
    │  └───────────┬───────────────┘  │
    │              │                   │
    │  ┌───────────▼───────────────┐  │
    │  │ Models (ORM)              │  │
    │  │ - User                    │  │
    │  │ - Task                    │  │
    │  └───────────┬───────────────┘  │
    └──────────────┼──────────────────┘
                   │ SQL/Async
                   │
    ┌──────────────▼──────────────┐
    │     DATABASE                │
    │     PostgreSQL              │
    │     (dockerized)            │
    └─────────────────────────────┘
```

### Data Flow for a Typical Request:

```
1. User performs action (create task)
   ↓
2. Frontend: onClick → useMutation
   ↓
3. Frontend: Local validation (type, required fields)
   ↓
4. Frontend: POST /api/v1/tasks {name, description}
   ↓
5. Backend: Router receives request
   ↓
6. Backend: Pydantic schema validates (required fields, types)
   ↓
7. Backend: Service executes logic (DB, permissions)
   ↓
8. Backend: Returns {status: "success", data: {...}}
   ↓
9. Frontend: TanStack Query receives, caches
   ↓
10. Frontend: useMutation.isSuccess = true
    ↓
11. Frontend: UI updates, shows new task
```

---

## 4. MONOREPO STRUCTURE

```
project-root/
├── .env                           # Global variables (no commit)
├── .env.example                   # Example (commit)
├── docker-compose.yml             # Service orchestration
├── Dockerfile.backend             # Backend build
├── nginx.conf                     # Nginx configuration
├── .gitignore
├── README.md
├── LICENSE
│
├── backend/                       # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── main.py               # Entry point, ASGI app
│   │   ├── core/
│   │   │   ├── config.py          # Global settings
│   │   │   ├── security.py        # JWT, passwords
│   │   │   └── exceptions.py      # Custom exceptions
│   │   ├── models/                # SQLAlchemy ORM
│   │   │   ├── __init__.py
│   │   │   ├── base.py            # Base class
│   │   │   ├── user.py            # User model
│   │   │   └── task.py            # Task model
│   │   ├── schemas/               # Pydantic DTOs
│   │   │   ├── __init__.py
│   │   │   ├── user.py            # UserCreate, UserResponse
│   │   │   └── task.py            # TaskCreate, TaskResponse
│   │   ├── services/              # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── base_service.py    # BaseService class
│   │   │   ├── auth_service.py    # Login, register
│   │   │   └── task_service.py    # Task CRUD
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py      # Registers all routers
│   │   │       ├── auth.py        # Auth endpoints
│   │   │       └── tasks.py       # Task endpoints
│   │   ├── db.py                  # Database setup, SessionLocal
│   │   └── middleware.py          # CORS, logging, etc
│   ├── migrations/                # Alembic DB migrations
│   │   ├── env.py
│   │   ├── versions/
│   │   └── alembic.ini
│   ├── tests/                     # pytest tests
│   │   ├── conftest.py            # Global fixtures
│   │   ├── test_auth.py
│   │   └── test_tasks.py
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Env variables
│   └── Dockerfile                 # Backend build
│
├── frontend/                      # Next.js + React
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root layout
│   │   │   ├── page.tsx           # Home page
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx     # Dashboard layout (protected)
│   │   │   │   ├── page.tsx       # Dashboard home
│   │   │   │   └── tasks/
│   │   │   │       ├── page.tsx   # Tasks list
│   │   │   │       ├── [id]/page.tsx
│   │   │   │       └── new/page.tsx
│   │   │   └── error.tsx          # Error boundary
│   │   ├── components/
│   │   │   ├── ui/                # Shadcn components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   └── ...
│   │   │   ├── providers.tsx      # QueryClientProvider, etc
│   │   │   ├── header.tsx         # App header
│   │   │   ├── sidebar.tsx        # Sidebar navigation
│   │   │   └── tasks/
│   │   │       ├── TaskList.tsx
│   │   │       ├── TaskForm.tsx
│   │   │       └── TaskItem.tsx
│   │   ├── lib/
│   │   │   ├── api.ts             # Axios client, interceptors
│   │   │   ├── constants.ts       # URLs, config
│   │   │   ├── utils.ts           # Generic helpers
│   │   │   └── validators.ts      # Form validation
│   │   ├── hooks/
│   │   │   ├── useAuth.ts         # Auth context/hook
│   │   │   ├── useUser.ts         # User queries/mutations
│   │   │   ├── useTasks.ts        # Task queries/mutations
│   │   │   └── useLocalStorage.ts # Local storage hook
│   │   ├── types/
│   │   │   ├── index.ts           # Global types
│   │   │   ├── api.ts             # Response types
│   │   │   ├── user.ts            # User types
│   │   │   └── task.ts            # Task types
│   │   └── styles/
│   │       └── globals.css        # Tailwind config
│   ├── public/                    # Static files
│   ├── tests/                     # Jest + RTL tests
│   │   ├── __mocks__/
│   │   ├── hooks/
│   │   └── components/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── .env.example
│   └── Dockerfile

└── docs/                          # Documentation (optional)
    ├── API.md                     # API reference
    ├── PATTERNS.md                # Design patterns
    ├── CONTRIBUTING.md            # Guidelines
    └── SETUP.md                   # Setup instructions
```

### Folder Explanations:

**Backend:**
- `models/`: ORM definitions (SQLAlchemy)
- `schemas/`: Data validation (Pydantic) + serialization
- `services/`: Pure business logic, reusable
- `api/`: HTTP handlers, routing
- `core/`: Config, security, shared utilities
- `migrations/`: Alembic version control for DB

**Frontend:**
- `app/`: File-based routing (Next.js App Router)
- `components/`: React components
  - `ui/`: Dumb components (Shadcn)
  - Others: Feature-specific components
- `lib/`: Non-React utilities (API client, validators)
- `hooks/`: Custom React hooks
- `types/`: TypeScript interfaces

---

## 5. API CONTRACT (Frontend ↔ Backend)

### Request Standards

#### Authentication
```http
GET /api/v1/users/me
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Required headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {token}` (if auth required)

#### HTTP Methods
- `POST`: Create resource
- `GET`: Read resource(s)
- `PUT`: Replace entire entity
- `PATCH`: Partial update
- `DELETE`: Delete

#### URLs
- Plural for collections: `/api/v1/tasks`
- Singular with ID for resource: `/api/v1/tasks/{id}`
- Sub-resources: `/api/v1/tasks/{id}/comments`

#### Query Parameters
```
GET /api/v1/tasks?skip=0&limit=10&status=completed&sort=-created_at
```

**Standards:**
- `skip`: offset for pagination (default: 0)
- `limit`: items per page (default: 10, max: 100)
- `sort`: ordering (-field for descending)
- Additional filters: `status=completed`

#### Body (POST/PUT/PATCH)
```json
{
  "name": "Buy groceries",
  "description": "Milk, eggs, bread",
  "dueDate": "2024-12-25"
}
```

**Rules:**
- Always valid JSON
- Required fields validated in Pydantic
- Correct types (string, number, boolean, etc)
- Don't include read-only fields (id, createdAt)

---

### Response Standards

#### Success Response (2xx)
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Buy groceries",
    "description": "Milk, eggs, bread",
    "dueDate": "2024-12-25",
    "completed": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "v1"
  }
}
```

#### List Response (with pagination)
```json
{
  "status": "success",
  "data": [
    { "id": 1, "name": "Task 1", ... },
    { "id": 2, "name": "Task 2", ... }
  ],
  "pagination": {
    "total": 42,
    "skip": 0,
    "limit": 10,
    "hasMore": true
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "v1"
  }
}
```

#### Error Response (4xx, 5xx)
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "v1"
  }
}
```

#### Possible Errors
```json
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

```json
{
  "status": "error",
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission"
  }
}
```

```json
{
  "status": "error",
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

```json
{
  "status": "error",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An error occurred. Please try again later"
  }
}
```

**Status codes:**
- 200: OK
- 201: Created
- 400: Bad Request (validation)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

---

## 6. MAIN FLOWS

### 6.1 Authentication (Login)

**Frontend:**
```typescript
// 1. User enters credentials
const { mutate: login } = useLogin();
login({ email: "user@example.com", password: "password" });

// 2. The hook makes POST to /api/v1/auth/login
// 3. Receives response with token
// 4. Saves token in localStorage
// 5. Redirects to /dashboard
```

**Backend:**
```python
# POST /api/v1/auth/login
@router.post("/login")
async def login(credentials: LoginSchema, db: AsyncSession = Depends(get_db)):
    # 1. Validate email/password in DB
    user = await auth_service.authenticate_user(credentials.email, credentials.password)
    
    # 2. Generate JWT token
    token = create_access_token(user.id)
    
    # 3. Return response
    return {
        "status": "success",
        "data": {
            "user": UserResponseSchema.from_orm(user),
            "token": token
        }
    }
```

**Token storage:**
- Frontend: `localStorage.setItem('token', response.data.token)`
- Every request: `headers.Authorization = 'Bearer ' + token`

**Token validation (Backend):**
```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user
```

---

### 6.2 Entity CRUD (Tasks)

#### CREATE

**Frontend:**
```typescript
const { mutate: createTask } = useCreateTask();
createTask({ name: "...", description: "..." });
// → POST /api/v1/tasks
```

**Backend:**
```python
@router.post("/", response_model=TaskResponseSchema)
async def create_task(
    task_create: TaskCreateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = TaskService(db)
    new_task = await service.create(task_create, current_user.id)
    return new_task
```

**Service:**
```python
class TaskService(BaseService):
    async def create(self, task_create: TaskCreateSchema, user_id: int):
        # 1. Validate permissions
        # 2. Create instance
        task = Task(
            name=task_create.name,
            user_id=user_id
        )
        # 3. Save to DB
        db.add(task)
        await db.commit()
        await db.refresh(task)
        return task
```

#### READ

**Frontend:**
```typescript
const { data: tasks, isLoading } = useTasks();
// → GET /api/v1/tasks?skip=0&limit=10
```

**Backend:**
```python
@router.get("/", response_model=List[TaskResponseSchema])
async def list_tasks(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = TaskService(db)
    tasks = await service.list(user_id=current_user.id, skip=skip, limit=limit)
    return tasks
```

#### UPDATE

**Frontend:**
```typescript
const { mutate: updateTask } = useUpdateTask();
updateTask({ id: 1, data: { name: "Updated" } });
// → PATCH /api/v1/tasks/1
```

**Backend:**
```python
@router.patch("/{task_id}", response_model=TaskResponseSchema)
async def update_task(
    task_id: int,
    task_update: TaskUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = TaskService(db)
    task = await service.update(task_id, task_update, current_user.id)
    return task
```

#### DELETE

**Frontend:**
```typescript
const { mutate: deleteTask } = useDeleteTask();
deleteTask({ id: 1 });
// → DELETE /api/v1/tasks/1
```

**Backend:**
```python
@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = TaskService(db)
    await service.delete(task_id, current_user.id)
```

---

### 6.3 Error Handling

**Frontend:**
```typescript
const { mutate, error } = useCreateTask();

// Access the error:
if (error) {
  const apiError = error as AxiosError<ErrorResponse>;
  const errorCode = apiError.response?.data.error.code;
  const errorMessage = apiError.response?.data.error.message;
  
  // Show notification
  toast.error(errorMessage || "Something went wrong");
}
```

**Backend:**
```python
# Custom exceptions
class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code

# Exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

# Usage in service
if not user:
    raise AppException(
        code="USER_NOT_FOUND",
        message="User does not exist",
        status_code=404
    )
```

---

### 6.4 Global State + Persistence

**Zustand (if used):**
```typescript
// store/authStore.ts
create<AuthStore>((set) => ({
  user: null,
  token: null,
  
  setAuth: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
```

**TanStack Query (recommended):**
```typescript
// hooks/useAuth.ts
const useAuth = () => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
```

---

## 7. STANDARD PATTERNS

### 7.1 Complete CRUD Pattern (New Entity)

When adding a new entity (e.g.: `Clients`), follow this pattern:

#### Backend

**1. Model (SQLAlchemy)**
```python
# app/models/client.py
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.models.base import Base

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**2. Schemas (Pydantic)**
```python
# app/schemas/client.py
from pydantic import BaseModel, EmailStr
from datetime import datetime

class ClientCreateSchema(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None

class ClientUpdateSchema(BaseModel):
    name: str | None = None
    phone: str | None = None

class ClientResponseSchema(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

**3. Service**
```python
# app/services/client_service.py
from app.services.base_service import BaseService
from app.models.client import Client
from app.schemas.client import ClientCreateSchema

class ClientService(BaseService):
    model = Client
    
    async def create(self, client_create: ClientCreateSchema, user_id: int):
        # Check email unique
        existing = await self.db.execute(
            select(Client).where(Client.email == client_create.email)
        )
        if existing.scalar():
            raise AppException("EMAIL_TAKEN", "Email already exists", 400)
        
        # Create
        client = Client(**client_create.dict(), user_id=user_id)
        self.db.add(client)
        await self.db.commit()
        await self.db.refresh(client)
        return client
```

**4. API Router**
```python
# app/api/v1/clients.py
from fastapi import APIRouter, Depends
from app.schemas.client import ClientCreateSchema, ClientResponseSchema
from app.services.client_service import ClientService

router = APIRouter(prefix="/clients", tags=["clients"])

@router.post("/", response_model=ClientResponseSchema)
async def create_client(
    client_create: ClientCreateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ClientService(db)
    client = await service.create(client_create, current_user.id)
    return client

@router.get("/", response_model=List[ClientResponseSchema])
async def list_clients(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ClientService(db)
    query = select(Client).where(Client.user_id == current_user.id)
    clients = await service.list(query, skip=skip, limit=limit)
    return clients

@router.get("/{client_id}", response_model=ClientResponseSchema)
async def get_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ClientService(db)
    client = await service.get_or_404(client_id, user_id=current_user.id)
    return client

@router.patch("/{client_id}", response_model=ClientResponseSchema)
async def update_client(
    client_id: int,
    client_update: ClientUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ClientService(db)
    client = await service.update(client_id, client_update, user_id=current_user.id)
    return client

@router.delete("/{client_id}", status_code=204)
async def delete_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ClientService(db)
    await service.delete(client_id, user_id=current_user.id)
```

**5. Register router**
```python
# app/api/v1/router.py
from .clients import router as clients_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(clients_router)
```

**6. Migration**
```bash
cd backend
alembic revision --autogenerate -m "Add Client model"
alembic upgrade head
```

#### Frontend

**1. Types**
```typescript
// src/types/client.ts
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientCreateInput {
  name: string;
  email: string;
  phone?: string;
}
```

**2. API Service**
```typescript
// src/lib/clients.ts
import api from "@/lib/api";
import { Client, ClientCreateInput } from "@/types/client";

export const clientApi = {
  list: (skip = 0, limit = 10) =>
    api.get<{ data: Client[] }>("/clients", { params: { skip, limit } }),
  
  get: (id: number) =>
    api.get<{ data: Client }>(`/clients/${id}`),
  
  create: (data: ClientCreateInput) =>
    api.post<{ data: Client }>("/clients", data),
  
  update: (id: number, data: Partial<ClientCreateInput>) =>
    api.patch<{ data: Client }>(`/clients/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/clients/${id}`),
};
```

**3. Hook**
```typescript
// src/hooks/useClients.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/clients";

export const useClients = (skip = 0, limit = 10) => {
  return useQuery({
    queryKey: ["clients", skip, limit],
    queryFn: () => clientApi.list(skip, limit),
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clientApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      clientApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clientApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};
```

**4. Component**
```typescript
// src/components/clients/ClientForm.tsx
'use client';
import { useCreateClient } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ClientForm() {
  const { mutate: createClient, isPending } = useCreateClient();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createClient({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input name="name" placeholder="Client name" required />
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="phone" placeholder="Phone" />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Client"}
      </Button>
    </form>
  );
}
```

**5. Page**
```typescript
// src/app/(dashboard)/clients/page.tsx
'use client';
import { useClients } from "@/hooks/useClients";
import { ClientForm } from "@/components/clients/ClientForm";
import { ClientList } from "@/components/clients/ClientList";

export default function ClientsPage() {
  const { data, isLoading } = useClients();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Clients</h1>
      
      <ClientForm />
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ClientList clients={data?.data || []} />
      )}
    </div>
  );
}
```

---

## 8. SECURITY

### Authentication
- **Method**: JWT (JSON Web Tokens)
- **Algorithm**: HS256
- **Frontend Storage**: localStorage (consider httpOnly if possible)
- **Duration**: 24 hours (configurable in .env)
- **Refresh**: Implement if necessary

### Authorization
- **Owner-based**: Users see/edit only their own data
- **Validate in backend**: Always verify `user_id` in every operation
- **Principle of least privilege**: Don't return more data than necessary

### CORS
```python
# Backend config
allow_origins = [
    "http://localhost:3000",    # Local dev
    "https://app.example.com"   # Production
]
```

### SQL Injection
- **Protection**: SQLAlchemy ORM, parameterized queries
- **Never**: String interpolation in queries

### XSS
- **React**: Escapes automatically
- **Never**: `dangerouslySetInnerHTML` without sanitization

### CSRF
- **If using cookies**: Implement CSRF tokens
- **JWT**: Not necessary (tokens in header)

### Secrets
- **.env**: Never commit
- **.env.example**: Version with dummy values
- **CI/CD**: Inject at build time
- **Production**: Use secrets manager (AWS Secrets, etc)

### Validation
- **Frontend**: UX, not security
- **Backend**: Rigorous validation ALWAYS
- **Rule**: Validate all input as if it came from an attacker

---

## 9. TESTING

### Backend (pytest)

**Structure:**
```
backend/tests/
├── conftest.py              # Global fixtures
├── test_auth.py
├── test_clients.py
└── fixtures/
    └── sample_data.py
```

**DB Fixture:**
```python
@pytest.fixture
async def db():
    """In-memory DB for tests"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSession(engine) as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
```

**Test example:**
```python
@pytest.mark.asyncio
async def test_create_client(db):
    service = ClientService(db)
    
    client = await service.create(
        ClientCreateSchema(
            name="Acme Corp",
            email="contact@acme.com"
        ),
        user_id=1
    )
    
    assert client.id is not None
    assert client.name == "Acme Corp"
```

**Coverage:**
- Models: 100%
- Services: 80%
- Routers: 75%
- Overall: 70%

### Frontend (Jest + RTL)

**Test example:**
```typescript
describe("useClients", () => {
  it("should fetch clients", async () => {
    const { result } = renderHook(() => useClients());
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data?.data).toHaveLength(2);
  });
});
```

**Coverage:**
- Hooks: 80%
- Components: 70%
- Overall: 70%

---

## 10. DEPLOYMENT

### Preparation
- [ ] Production env variables configured
- [ ] Secure secrets (JWT_SECRET, DB_PASSWORD)
- [ ] CORS configured for production domain
- [ ] Migrations applied to production DB
- [ ] Tests passing 100%

### Docker Build
```bash
docker build -f Dockerfile.backend -t app:latest .
docker build -f frontend/Dockerfile -t app-frontend:latest ./frontend
```

### Environment per stage
```
Local (docker-compose.yml)
  → DATABASE_URL=postgresql://user:password@postgres/dbname
  → DEBUG=true

Staging
  → DATABASE_URL=[prod url]
  → DEBUG=false

Production
  → DATABASE_URL=[prod url]
  → SECRET_KEY=[prod key]
  → DEBUG=false
```

---

## 11. ROADMAP

### MVP (v1.0) - CURRENT
- ✅ Auth (login/register, refresh tokens, rotation) — ADR-0002
- ✅ Ownership isolation (`require_ownership`, `BaseService.scope`) — ADR-0004
- ✅ Tasks CRUD + `project_id` relation + Kanban board (`status`)
- ✅ Projects CRUD (second owned entity demo)
- ✅ Per-user Attachments (`POST/GET/DELETE /api/v1/uploads`) with dropzone UI
- ✅ Admin surface: users, roles (M:N demo), audit logs viewer, system settings
- ✅ Dashboard `/` with aggregated metrics + theme-aware recharts
- ✅ Application shell: collapsible sidebar, breadcrumbs, command palette (Ctrl+K),
      notifications popover, user menu, dark/light/system theme — ADR-0008
- ✅ Self-service profile + password change (`PATCH /auth/me`, `POST /auth/me/password`)
- ✅ Kitchen Sink (`/kitchen-sink`) — live gallery of every UI primitive
- ✅ API docs (Swagger) + OpenAPI → TS types (`make types`) — ADR-0005
- ✅ Structured JSON logs + persistent `audit_logs` — ADR-0007
- ✅ Docker setup with dev override
- ✅ Contract + IDOR + smoke tests — ADR-0006

### v1.1 (next)
- [ ] Email verification + password-reset-by-email flow
- [ ] Task filters/search (server-side full-text)
- [ ] Sharing tasks (row-level ACLs beyond single-owner)
- [ ] E2E coverage for Kanban drag-and-drop and uploads (Playwright)

### v1.2
- [ ] Real-time updates (Server-Sent Events or WebSockets)
- [ ] Email notifications
- [ ] Object-storage backend for `/uploads` (S3 / MinIO pluggable driver)
- [ ] OpenTelemetry tracing (successor to ADR-0007)

### v2.0
- [ ] Teams / multi-tenant collaboration
- [ ] Make `require_role` consume the `roles` / `permissions` join table
- [ ] Per-identity API rate limiting beyond the Nginx edge limiter (ADR-0015)
- [ ] `audit_logs` partitioning + retention job

---

## 12. PROPOSED IMPROVEMENTS (ACTIONABLE)

### A. Type Synchronization (Frontend ↔ Backend)
**Problem**: Duplicating types in TS and Pydantic is error-prone
**Solution**: 
1. Consider OpenAPI schema generation from backend
2. Frontend generates types automatically: `openapi-typescript`

**Command:**
```bash
npx openapi-typescript http://localhost:8000/openapi.json -o src/types/api.ts
```

### B. Base Service Class
**Create reusable `BaseService`:**
```python
class BaseService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def list(self, query, skip=0, limit=10):
        result = await self.db.execute(query.offset(skip).limit(limit))
        return result.scalars().all()
    
    async def get_or_404(self, id: int, **filters):
        obj = await self.db.get(self.model, id, **filters)
        if not obj:
            raise AppException("NOT_FOUND", "Resource not found", 404)
        return obj
    
    async def delete(self, id: int, **filters):
        obj = await self.get_or_404(id, **filters)
        await self.db.delete(obj)
        await self.db.commit()
```

### C. Response Wrapper Middleware
**Centralize response format:**
```python
@app.middleware("http")
async def response_middleware(request, call_next):
    response = await call_next(request)
    
    # Wrap in {status, data, meta}
    if response.status_code < 400:
        body = json.loads(response.body)
        wrapped = {
            "status": "success",
            "data": body,
            "meta": {...}
        }
        return JSONResponse(wrapped)
    
    return response
```

### D. Improved Testing Strategy
- [ ] Add fixtures for common scenarios
- [ ] Add factories (factory_boy) for test data
- [ ] Add mocking for external services
- [ ] Add E2E with Playwright

### E. CI/CD Pipeline
```yaml
# .github/workflows/tests.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
    steps:
      - uses: actions/checkout@v3
      - name: Backend tests
        run: cd backend && pytest --cov
      - name: Frontend tests
        run: cd frontend && npm test
```

### F. Documentation
- [ ] API docs (Swagger already at `/docs`)
- [ ] Setup guide
- [ ] Contributing guidelines
- [ ] Architecture decision records (ADRs)

---

## 13. COMMON COMMANDS

### Backend
```bash
# Development
uvicorn app.main:app --reload

# Migrations
alembic revision --autogenerate -m "message"
alembic upgrade head

# Tests
pytest
pytest --cov=app
pytest -v

# Linting
pylint app/
black app/
isort app/
```

### Frontend
```bash
# Development
npm run dev

# Build
npm run build
npm run start

# Tests
npm test
npm run test:e2e

# Linting
npm run lint
npm run format
```

### Docker
```bash
# Start everything
docker compose up -d

# Logs
docker compose logs -f backend
docker compose logs -f frontend

# Shell
docker compose exec backend bash
docker compose exec frontend bash

# Rebuild
docker compose up -d --build
```

---

## 14. KEY DESIGN DECISIONS

| Decision | Chosen Option | Why |
|----------|---------------|-----|
| Backend framework | FastAPI | Async by default, automatic OpenAPI, fast |
| Frontend | Next.js App Router | File-based routing, Server Components, better SSR |
| State management | TanStack Query | Best for server state, automatic caching |
| Styles | Tailwind | Utility-first, consistent, fast |
| Components | Shadcn | Customizable, accessible, no lock-in |
| Auth | JWT | Stateless, scalable, simple |
| DB | PostgreSQL | Robust, relational, open-source |
| ORM | SQLAlchemy Async | Type-safe, async, mature |
| Migrations | Alembic | Standard, versioned, reversible |
| Containerization | Docker | Reproducible, deployment agnostic |

---

## 15. CONTACT AND MAINTENANCE

- **Author**: [Your name]
- **Last updated**: 2024-01-15
- **Status**: Production-Ready MVP
- **Current version**: 1.0.0

---

**This document is the "source of truth" for the framework.**
All decisions are made based on this.
Update as the project evolves.
