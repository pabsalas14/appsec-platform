import { z } from 'zod';

export const CodeSecurityReviewSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  titulo: z.string(),
  estado: z.string(),
  descripcion: z.string().nullable().optional(),
  progreso: z.number().int(),
  rama_analizar: z.string(),
  url_repositorio: z.string().nullable().optional(),
  scan_mode: z.string(),
  repositorio_id: z.string().uuid().nullable().optional(),
  github_org_slug: z.string().nullable().optional(),
  scan_batch_id: z.string().uuid().nullable().optional(),
  scr_config: z.record(z.string(), z.unknown()).nullable().optional(),
  agente_actual: z.string().nullable().optional(),
  actividad: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CodeSecurityReviewCreateSchema = z.object({
  titulo: z.string().min(3),
  estado: z.string().default('PENDING').optional(),
  descripcion: z.string().nullable().optional(),
  progreso: z.number().int().min(0).max(100).default(0).optional(),
  rama_analizar: z.string().default('main'),
  url_repositorio: z.string().nullable().optional(),
  scan_mode: z.enum(['PUBLIC_URL', 'REPO_TOKEN', 'BRANCH_TARGET', 'ORG_BATCH']).default('PUBLIC_URL'),
  repositorio_id: z.string().uuid().nullable().optional(),
  github_org_slug: z.string().nullable().optional(),
  scan_batch_id: z.string().uuid().nullable().optional(),
  scr_config: z.object({
    llm_provider: z.string().default('anthropic'),
    llm_model: z.string().optional(),
    llm_config_id: z.string().uuid().optional(),
    github_token_id: z.string().uuid().optional(),
    temperature: z.number().default(0.3),
    max_tokens: z.number().default(4096),
  }).catchall(z.unknown()).optional(),
  repo_token: z.string().nullable().optional(),
});

export const CodeSecurityReviewUpdateSchema = CodeSecurityReviewCreateSchema.partial();

export const CodeSecurityOrgBatchCreateSchema = z.object({
  github_org_slug: z.string().min(1),
  titulo: z.string().min(3),
  rama_analizar: z.string().default('main'),
  github_token_id: z.string().uuid().optional(),
  repo_urls: z.array(z.string()).optional(),
  scr_config: z.record(z.string(), z.unknown()).optional(),
});

export type CodeSecurityReview = z.infer<typeof CodeSecurityReviewSchema>;
export type CodeSecurityReviewCreate = z.infer<typeof CodeSecurityReviewCreateSchema>;
export type CodeSecurityReviewUpdate = z.infer<typeof CodeSecurityReviewUpdateSchema>;
export type CodeSecurityOrgBatchCreate = z.infer<typeof CodeSecurityOrgBatchCreateSchema>;
