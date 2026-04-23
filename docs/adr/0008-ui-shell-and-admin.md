# ADR-0008: Application shell, admin surface and feature-rich demo pages

- Status: accepted
- Date: 2026-04-22

## Context

Up to ADR-0007 the frontend was essentially a single `/tasks` page gated by
login. That was enough to exercise the backend contract, but it hid a lot of
the framework's own wiring from the people using it as a *starter kit*:

- There was no home to compose dashboards, which meant charting, `recharts`
  theming, and aggregation endpoints were missing from the template.
- Admins had no UI to create, edit, disable or password-reset other users;
  the role string on `users.role` was ungoverned.
- System-wide toggles (feature flags, branding, retention) lived only in
  `.env`, forcing a redeploy for any change.
- Several dozen UI primitives had no catalog page; devs had to grep the
  codebase to know what shipped.
- Advanced patterns the framework is supposed to illustrate — Kanban with
  drag-and-drop, multipart uploads, relations between two owned entities —
  were simply not demonstrated.

We want one consolidated shell that shows all of the above *in situ*, so
teams consuming the framework can copy real pages instead of assembling
them from docs.

## Decision

### 1. Authenticated shell at `app/(dashboard)/`

All post-login pages live under the `(dashboard)` route group and share a
single layout:

```
AuthGate → TooltipProvider → CommandPalette
         → <Sidebar> | <Header> | <main>{children}</main>
```

- `AuthGate` calls `GET /auth/me` and redirects to `/login` on failure.
- `Sidebar` is collapsible (persisted in `localStorage` via
  `useSidebarState`) and splits entries into `Principal`, `Administración`
  (admin-only), and `Developer`. Admin-only sections are hidden entirely
  when `useCurrentUser().role !== 'admin'`.
- `Header` composes `Breadcrumbs` (derived from `usePathname`), a
  `CommandPaletteTrigger` (Ctrl+K, powered by `cmdk`),
  `NotificationsPopover`, `ThemeToggle` (via `next-themes`), and
  `UserMenu`.
- Theme switching is global: `ThemeProvider` wraps the app tree in
  `providers.tsx`, and `recharts` wrappers under `components/charts`
  read CSS variables so every chart reacts to theme changes without
  re-mount.

### 2. Dashboard home with aggregation endpoint

`GET /api/v1/dashboard/stats` returns one payload with:

- task counters (total / completed / overdue / by status),
- user counters (admins only get the global view),
- recent `audit_logs` (admins only),
- an activity trend series suitable for `LineChartCard`.

Frontend consumes it through `useDashboardStats`; the home page renders
`StatCard`s plus three chart primitives (`BarChartCard`, `DonutChartCard`,
`LineChartCard`).

### 3. Full admin surface under `/admin/*`

A dedicated aggregator router (`app.api.v1.admin.router.admin_router`) is
mounted at `/api/v1/admin` and every sub-router requires
`Depends(require_role("admin"))`:

| Path                          | Purpose                                      |
|-------------------------------|----------------------------------------------|
| `/admin/users`                | CRUD users, reset password, activate/disable |
| `/admin/roles`                | Roles + permissions catalog (M:N demo)       |
| `/admin/audit-logs`           | Read-only viewer for the audit trail         |
| `/admin/settings`             | Runtime-mutable `system_settings` (JSONB)    |

Self-demote and self-deactivate are explicitly rejected in
`admin/users.py` — an admin cannot lock themselves out via the UI.

`roles` and `permissions` do **not** replace the existing `users.role`
string used by `require_role`; they are a demo of a many-to-many
relationship and are auto-seeded from `app.core.permissions.P`. Making
`require_role` consult the join table is an explicit follow-up that
requires schema work and is out of scope here.

`system_settings` uses a JSONB `value` column keyed by a stable string,
auto-seeded with `app.display_name`, `app.default_theme`, and
`features.registration_open`. The `/admin/settings` page edits values
in-place with type-aware editors (string / number / boolean / select).

### 4. Advanced demo pages

- `/kanban` — `@dnd-kit/core` + `@dnd-kit/sortable` board that mutates
  `tasks.status` via `PATCH /api/v1/tasks/:id`. Optional filter by
  `project_id` exercises the FK.
- `/uploads` — multipart upload with dropzone, thumbnail preview for
  images, per-user storage directory, and typed/size-limited validation
  on the backend (`ALLOWED_CONTENT_TYPES`, `MAX_UPLOAD_SIZE_MB`).
- `/profile` — tabbed self-service editor for full name, email
  (`PATCH /auth/me`) and password (`POST /auth/me/password`).
- `/kitchen-sink` — one page that instantiates every primitive exported
  from `@/components/ui`, so contributors see visually what the library
  ships.

### 5. New backend entities and migrations

| Entity             | Table                | Owner field | Notes                     |
|--------------------|----------------------|-------------|---------------------------|
| `Project`          | `projects`           | `user_id`   | Demo second CRUD + FK     |
| `Role` / `Permission` | `roles` / `permissions` / `role_permissions` | — | Admin-managed |
| `SystemSetting`    | `system_settings`    | —           | key → JSONB value         |
| `Attachment`       | `attachments`        | `user_id`   | Per-user uploads          |

`tasks` grew two nullable columns: `status` (for Kanban) and
`project_id` (FK → `projects.id` with `ON DELETE SET NULL`). All migrations
chain linearly from the initial revision (`bb1c68fed56b`).

## Consequences

**Positive**

- A freshly-cloned framework now demonstrates: login, CRUD, relations,
  ownership, admin operations, dashboards, file uploads, Kanban,
  drag-and-drop, and a component gallery — all against the same
  contract.
- Admin actions are auditable for free: every `BaseService` mutation
  already records an entry (ADR-0007); `auth.py` and
  `admin/settings.py` call `audit_service.record` explicitly for the
  handful of cases that don't go through a service.
- The sidebar and theme toggles live in one place, so product changes
  (branding, new routes) are local edits.

**Negative**

- More surface to maintain. Deleting a UI primitive now requires
  updating `/kitchen-sink` too. We accept this because the gallery is
  the documentation.
- `roles` + `permissions` tables can drift from the `require_role`
  source of truth. Contract test (TODO) should assert that every code
  in `app.core.permissions.P` has a matching row after seed.
- `/uploads` writes files to the local FS. For multi-replica
  deployments this must be replaced by S3 / MinIO; the router is the
  only place that touches storage, so the swap is localised.

**Follow-up**

- Collapse role strings into the `roles` table and make `require_role`
  join through it.
- Partition `audit_logs` (monthly) once real usage exceeds a few million
  rows.
- Add E2E tests (Playwright) for `/kanban` drag-and-drop and `/uploads`
  drag-and-drop.
- Move uploads to object storage behind a pluggable `StorageBackend`.

## Alternatives considered

- **One giant `/admin` page with tabs** — poor URLs, no deep-linking,
  painful to extend. Rejected.
- **Client-side-only system settings (`localStorage`)** — would defeat
  the point of "global preferences". Rejected.
- **Extending `users.role` into an enum column** — cheap now, expensive
  later. Keeping the string and adding the M:N demo keeps both doors
  open.
- **Building uploads with presigned S3 URLs out of the box** — adds a
  hard infra dependency the template shouldn't ship with. The local
  backend is intentional; swap it via ADR when needed.
