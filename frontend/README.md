# Frontend - AppSec Platform

React + Next.js 14 (App Router) frontend para la plataforma de gestión de ciberseguridad aplicativa.

**Stack:** Next.js 14 + TypeScript + Tailwind CSS + Shadcn UI + TanStack Query + Zod

---

## 🚀 Quick Start

### Desarrollo local

```bash
# 1. Backend debe estar corriendo
make up  # Desde raíz, levanta stack completo

# 2. Instalar dependencias frontend
cd frontend
npm install

# 3. Regenerar tipos desde OpenAPI
cd ..
make types

# 4. Correr dev server
cd frontend
npm run dev

# 5. Abrir en navegador
open http://localhost:3000
```

### Parar

```bash
cd frontend
npm run build  # Build para prod
npm run lint   # Validar
```

---

## 📊 Dashboards

### Dashboards Disponibles (9 totales)

| # | Nombre | Ruta | Descripción | Widgets |
|---|--------|------|-------------|---------|
| 1 | **Ejecutivo** | `/dashboards/executive` | KPIs ejecutivos de alto nivel | KPI Cards, Severity Chart |
| 2 | **Equipo** | `/dashboards/team` | Vista de equipo por analista | Analyst Breakdown, Workload |
| 3 | **Programas** | `/dashboards/programs` | Consolidado de programas (SAST/DAST/etc) | Program Table, Completion % |
| 4 | **Programa Detalle** | `/dashboards/program-detail` | Zoom en motor específico | Source Metrics, Overdue |
| 5 | **Vulnerabilidades** | `/dashboards/vulnerabilities` | Multidimensional por severidad/estado | Severity Breakdown, SLA Status |
| 6 | **Releases Tabla** | `/dashboards/releases-table` | Releases en formato tabla | Release Table, Filtering |
| 7 | **Releases Kanban** | `/dashboards/releases-kanban` | Releases en flujo kanban | Kanban Board, Drag-Drop |
| 8 | **Iniciativas** | `/dashboards/initiatives` | Seguimiento de iniciativas | Progress Bar, Status |
| 9 | **Temas Emergentes** | `/dashboards/emerging-themes` | Temas en evolución | Activity Timeline, Alerts |

### Estructura de Rutas

```
frontend/src/app/
├── (dashboard)/                    # Layout autenticado (AuthGate + Sidebar + Header)
│   └── dashboards/
│       ├── executive/page.tsx      # Dashboard 1
│       ├── team/page.tsx           # Dashboard 2
│       ├── programs/page.tsx       # Dashboard 3
│       ├── program-detail/page.tsx # Dashboard 4
│       ├── vulnerabilities/page.tsx # Dashboard 5
│       ├── releases-table/page.tsx # Dashboard 6
│       ├── releases-kanban/page.tsx # Dashboard 7
│       ├── initiatives/page.tsx    # Dashboard 8
│       └── emerging-themes/page.tsx # Dashboard 9
├── (auth)/                         # Layout anónimo (login, register)
└── kitchen-sink/page.tsx           # UI component gallery
```

---

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/                        # App Router (Next.js 14)
│   │   ├── (dashboard)/            # Rutas autenticadas
│   │   │   └── dashboards/         # 9 dashboards
│   │   └── (auth)/                 # Rutas públicas
│   ├── components/
│   │   ├── layout/                 # Sidebar, Header, CommandPalette
│   │   ├── charts/                 # Chart primitives (theme-aware)
│   │   │   ├── KPICard.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   ├── DataTable.tsx
│   │   │   └── index.ts
│   │   ├── kanban/                 # Drag-drop (dnd-kit)
│   │   ├── ui/                     # Shadcn primitives
│   │   ├── DashboardViewer.tsx     # Dashboard renderer
│   │   └── WidgetConfigPanel.tsx   # Widget configurator
│   ├── lib/
│   │   ├── api.ts                  # axios client wrapper
│   │   ├── logger.ts               # Client-side logger
│   │   └── schemas/                # Zod schemas (forms)
│   ├── hooks/
│   │   ├── useCurrentUser.ts       # Current user + refetch
│   │   └── useSidebarState.ts      # Sidebar collapsed state
│   ├── types/
│   │   ├── api.ts                  # 🤖 Generated from OpenAPI (no editar)
│   │   └── index.ts                # Hand-written types
│   └── __tests__/
│       └── e2e/
│           ├── dashboard-1-executive.spec.ts
│           └── ... (9 dashboards totales)
├── public/                         # Static assets
├── next.config.js                  # Next.js config
├── tailwind.config.ts              # Tailwind + CSS variables
└── package.json
```

---

## 📚 Components

### Chart Primitives (Theme-aware)

Todos en `src/components/charts/`:

```tsx
import { KPICard, TrendChart, DataTable } from '@/components/charts';

// KPI Card
<KPICard
  title="Total Vulnerabilities"
  value={234}
  trend={+12}
  severity="high"
/>

// Trend Chart
<TrendChart
  data={[{ day: "2026-04-25", count: 5 }]}
  title="Activity (7d)"
/>

// Data Table
<DataTable
  columns={[...]}
  data={releases}
/>
```

**Características:**
- ✅ Responden a `next-themes` (light/dark/system)
- ✅ Lee variables CSS (colores, espaciado)
- ✅ Sin hard-coded colors (mantenible)

### Layout Shell (Authenticated)

```tsx
// Heredado por todas las rutas en (dashboard)/
// app/(dashboard)/layout.tsx

<AuthGate>
  <TooltipProvider>
    <CommandPalette>
      <div className="flex">
        <Sidebar />        {/* Collapsible, role-aware */}
        <div className="flex flex-col flex-1">
          <Header />       {/* Breadcrumbs + utilities */}
          <main>{children}</main>
        </div>
      </div>
    </CommandPalette>
  </TooltipProvider>
</AuthGate>
```

**Componentes reutilizables:**
- `Sidebar` - Navegación principal (roles en sidebar.tsx)
- `Header` - Breadcrumbs + tema toggle + user menu
- `CommandPalette` - Ctrl+K
- `ThemeToggle` - Light/dark/system

---

## 🧪 Testing

### E2E Tests (Playwright)

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Watch mode
npm run test:e2e --watch

# Dashboard específico
npm run test:e2e dashboard-1-executive.spec.ts

# Headed browser
npm run test:e2e --headed
```

### Ubicación

Tests en `frontend/src/__tests__/e2e/`:

```
dashboard-1-executive.spec.ts     # Dashboard ejecutivo
dashboard-2-team.spec.ts          # Dashboard equipo
dashboard-3-programs.spec.ts      # Dashboard programas
... (hasta 9 totales)
```

### Estructura típica

```typescript
import { test, expect } from '@playwright/test';

test('Dashboard 1: Load executive KPIs', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name=email]', 'admin@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button:has-text("Sign In")');
  
  // Navigate to dashboard
  await page.goto('/dashboards/executive');
  
  // Check elements
  await expect(page.locator('text=Total Vulnerabilities')).toBeVisible();
  await expect(page.locator('[data-testid=kpi-card]')).toHaveCount(3);
});
```

### Type Safety

```bash
# Check types (sin emitir JS)
npm run tsc

# ESLint
npm run lint

# Ambos
npm run check
```

---

## 📡 API Integration

### Tipos Generados

`src/types/api.ts` se regenera automáticamente desde OpenAPI:

```bash
make types  # Regenera desde backend corriendo
```

**Nunca editar a mano** - Importar desde `@/types/api`:

```typescript
import type {
  DashboardStatsResponse,
  ExecutiveKPIsResponse,
  VulnerabilitiesResponse,
} from '@/types/api';
```

### API Client

**Usar `@/lib/api` SIEMPRE** (never `axios` directly):

```typescript
import { api } from '@/lib/api';

// GET
const response = await api.get('/dashboard/executive');

// POST (con CSRF token automático para cookies)
const response = await api.post('/dashboard-config', {
  dashboard_id: 'home',
  widget_id: 'kpi_1',
  visible: true,
});

// PATCH, DELETE, etc.
```

**Beneficios:**
- ✅ CSRF token inyectado automáticamente
- ✅ Error handling centralizado
- ✅ Type-safe responses (con types/api.ts)
- ✅ Request/response logging

### Zod Schemas (Forms)

En `src/lib/schemas/`:

```typescript
// dashboard.ts
import { z } from 'zod';

export const dashboardCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  widgets: z.array(z.any()).default([]),
});

export type DashboardCreate = z.infer<typeof dashboardCreateSchema>;
```

**Uso en forms:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dashboardCreateSchema } from '@/lib/schemas/dashboard';

export function CreateDashboardForm() {
  const form = useForm({
    resolver: zodResolver(dashboardCreateSchema),
  });
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  );
}
```

---

## 🎨 Styling

### Tailwind + CSS Variables

`tailwind.config.ts`:

```typescript
{
  theme: {
    extend: {
      colors: {
        'severity-critical': 'hsl(var(--severity-critical))',
        'severity-high': 'hsl(var(--severity-high))',
        // ...
      },
    },
  },
}
```

`globals.css`:

```css
:root {
  --severity-critical: 0 100% 50%;      /* Red */
  --severity-high: 25 100% 50%;         /* Orange */
  --severity-medium: 45 100% 50%;       /* Yellow */
  --severity-low: 180 100% 50%;         /* Blue */
}

[data-theme='dark'] {
  --severity-critical: 0 100% 60%;
  /* ... ajustes para dark mode */
}
```

**Uso en componentes:**

```tsx
<div className="bg-severity-critical text-white">
  Critical Finding
</div>
```

---

## 🚀 Development Workflow

### Adding a New Dashboard

1. **Crear página:**
   ```bash
   mkdir -p src/app/\(dashboard\)/dashboards/my-dashboard
   touch src/app/\(dashboard\)/dashboards/my-dashboard/page.tsx
   ```

2. **Importar tipos + API:**
   ```typescript
   import type { MyDashboardResponse } from '@/types/api';
   import { api } from '@/lib/api';
   
   export default async function MyDashboardPage() {
     const data: MyDashboardResponse = await api.get('/api/v1/dashboard/my-dashboard');
     
     return (
       <div>
         {/* Render */}
       </div>
     );
   }
   ```

3. **Agregar a layout:**
   - Sidebar navigation automático (revisar `components/layout/Sidebar.tsx`)

4. **E2E test:**
   ```bash
   touch src/__tests__/e2e/dashboard-X-name.spec.ts
   ```

5. **Regenerar tipos:**
   ```bash
   make types
   ```

---

## 📋 Environment Variables

Crear `.env.local`:

```bash
# API URL (deja vacío para usar relativo vía Nginx)
NEXT_PUBLIC_API_URL=

# O para dev directo al backend:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Build-time
NEXT_PUBLIC_APP_NAME=AppSec Platform
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## 🔐 Auth Integration

### AuthGate Component

En `components/layout/AuthGate.tsx`:

```typescript
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useCurrentUser();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <Navigate to="/login" />;
  
  return children;
}
```

### useCurrentUser Hook

En `hooks/useCurrentUser.ts`:

```typescript
export function useCurrentUser() {
  const query = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await api.get('/api/v1/auth/me');
      return response.data;
    },
  });
  
  return query;
}
```

### Cookie-only Auth (ADR-0010)

- ✅ Login sets cookies automáticamente
- ✅ No tokens en localStorage/sessionStorage
- ✅ CSRF protection en mutaciones

---

## 📊 Logging

### Client-side Logger

```typescript
import { logger } from '@/lib/logger';

// Dev: console.* con [app] prefix
// Prod: POST /api/v1/client-logs (batched)

logger.info('dashboard.view', { dashboardId: '123' });
logger.error('unexpected.state', { error: e.message });
logger.warn('slow.query', { duration: 2500 });
```

**Características:**
- ✅ Structured logging
- ✅ Request correlation (`X-Request-ID`)
- ✅ Batched en prod (5s buffer)
- ✅ Silencioso en network errors

---

## 🧪 Kitchen Sink

Galería de componentes UI + dashboards en desarrollo:

```bash
open http://localhost:3000/kitchen-sink
```

Ruta: `src/app/(dashboard)/kitchen-sink/page.tsx`

**Úsalo para:**
- Previsualizaciones rápidas
- Testing de temas
- Documentación visual

---

## 📚 Resources

- **Backend API:** `/backend/docs/ENDPOINTS_DASHBOARDS.md`
- **Types Generated:** `src/types/api.ts`
- **UI Components:** `src/components/ui/`
- **Layout:** `src/components/layout/`
- **Charts:** `src/components/charts/`
- **ADRs:** `/docs/adr/`

---

## 🛠️ Troubleshooting

### CORS Error

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solución:**
- Backend debe estar corriendo
- Si `NEXT_PUBLIC_API_URL` está definido, debe ser accesible
- Si vacío, Nginx debe routear `/api/v1` → backend

### Types Not Regenerated

```bash
# Asegurar backend está corriendo
make up

# Regenerar
make types

# Commit
git add frontend/src/types/api.ts
git commit -m "chore: regenerate types"
```

### Build Fails with Type Errors

```bash
# Check
npm run tsc

# Fix imports (generalmente @/types/api mal importado)
```

### Slow Dashboard Load

```typescript
// Usar React.memo + useMemo
export const KPICard = React.memo(({ data }) => {
  const value = useMemo(() => expensiveCalc(data), [data]);
  return <div>{value}</div>;
});
```

---

## 🤝 Contributing

Antes de pushear:

```bash
# Lint
npm run lint

# Type check
npm run tsc

# Build
npm run build

# E2E tests (opcional pero recomendado)
npm run test:e2e

# Commit
git add .
git commit -m "feat: brief description"
```

---

**Versión:** 1.0  
**Actualizado:** Abril 2026  
**Mantenedor:** Equipo de plataforma AppSec
