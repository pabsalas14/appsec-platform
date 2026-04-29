/**
 * Plataforma AppSec API types.
 *
 * Generated request-body schemas are re-exported from `./api` (produced by
 * `openapi-typescript` — see ADR-0005 / `make types`). Response shapes are
 * temporarily hand-written below: backend routes don't currently declare
 * `response_model=` so `*Read` schemas are inlined and never reach
 * `components.schemas` in the OpenAPI. Once every route is migrated to
 * `response_model=<…>Read`, regenerate `api.ts` and replace the hand-written
 * shapes by `components['schemas'][…]` re-exports (AGENTS.md MUST NEVER rule #7).
 */

import type { components } from './api';

// ─── Envelope (framework-wide, not per entity) ──────────────────────────────

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiError {
  status: 'error';
  detail: string | Array<{ loc: (string | number)[]; msg: string; type: string }>;
  code?: string;
}

// ─── Request bodies — re-exported from generated OpenAPI ───────────────────

export type UserAdminCreate = components['schemas']['UserAdminCreate'];
export type UserAdminUpdate = components['schemas']['UserAdminUpdate'];
export type UserCreate = components['schemas']['UserCreate'];
export type UserPasswordReset = components['schemas']['UserPasswordReset'];
export type TaskCreate = components['schemas']['TaskCreate'];
export type TaskUpdate = components['schemas']['TaskUpdate'];
export type ProjectCreate = components['schemas']['ProjectCreate'];
export type ProjectUpdate = components['schemas']['ProjectUpdate'];
export type RoleCreate = components['schemas']['RoleCreate'];
export type RoleUpdate = components['schemas']['RoleUpdate'];
export type SystemSettingUpsert = components['schemas']['SystemSettingUpsert'];
export type PasswordChange = components['schemas']['PasswordChange'];
export type ProfileUpdate = components['schemas']['ProfileUpdate'];
export type LoginRequest = components['schemas']['LoginRequest'];

// ─── Response shapes (hand-written, see ADR-0005 TODO above) ────────────────

/** Mirrors `backend/app/schemas/auth.py::UserRead`. */
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Mirrors `backend/app/schemas/task.py::TaskRead`. */
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  status: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Mirrors `backend/app/schemas/project.py::ProjectRead`. */
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

/** Mirrors `backend/app/schemas/role.py::PermissionRead`. */
export interface Permission {
  id: string;
  code: string;
  description: string | null;
}

/** Mirrors `backend/app/schemas/role.py::RoleRead`. */
export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

/** Mirrors `backend/app/schemas/system_setting.py::SystemSettingRead`. */
export interface SystemSetting {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}

/** Mirrors `backend/app/schemas/attachment.py::AttachmentRead`. */
export interface Attachment {
  id: string;
  user_id: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
  url: string;
}

/** Mirrors `backend/app/schemas/audit_log.py::AuditLogRead`. */
export interface AuditLog {
  id: string;
  ts: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip: string | null;
  user_agent: string | null;
  request_id: string | null;
  status: string;
  metadata: Record<string, unknown>;
}

export interface CodeSecurityReview {
  id: string;
  user_id: string;
  titulo: string;
  estado: string;
  descripcion: string | null;
  progreso: number;
  rama_analizar: string;
  url_repositorio: string | null;
  scan_mode: string;
  repositorio_id: string | null;
  github_org_slug?: string | null;
  scan_batch_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CodeSecurityFinding {
  id: string;
  review_id: string;
  archivo: string;
  linea_inicio: number;
  linea_fin: number;
  tipo_malicia: string;
  severidad: string;
  confianza: number;
  descripcion: string;
  estado: string;
}

export interface CodeSecurityEvent {
  id: string;
  review_id: string;
  event_ts: string;
  commit_hash: string;
  autor: string;
  archivo: string;
  accion: string;
  nivel_riesgo: string;
  indicadores: string[];
  descripcion?: string | null;
}

export interface CodeSecurityReport {
  id: string;
  review_id: string;
  resumen_ejecutivo: string;
  desglose_severidad: Record<string, number>;
  narrativa_evolucion?: string | null;
  pasos_remediacion: string[];
  puntuacion_riesgo_global: number;
}

// ─── AI Rules (FASE 8) ────────────────────────────────────────────────────────

export type {
  AIRuleBase,
  AIRuleCreate,
  AIRuleRead,
  AIRuleUpdate,
  AIRuleList,
  AIRuleTest,
  AIRuleTestResult,
  TriggerType,
  ActionType,
  TriggerMetadata,
  ActionMetadata,
} from './ai-rules';
