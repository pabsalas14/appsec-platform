import { z } from 'zod';

export const TIPOS_PIPELINE = ['SAST', 'DAST', 'SCA'] as const;
export const RESULTADOS_PIPELINE = [
  'Pendiente',
  'En Progreso',
  'Exitoso',
  'Fallido',
  'Cancelado',
] as const;

const tipoE = z.enum(TIPOS_PIPELINE);
const resE = z.enum(RESULTADOS_PIPELINE);

export const PipelineReleaseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  service_release_id: z.string().uuid().nullable().optional(),
  repositorio_id: z.string().uuid(),
  rama: z.string(),
  commit_sha: z.string().nullable().optional(),
  tipo: z.string(),
  resultado: z.string(),
  herramienta: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Incluye `''` en service_release_id para el Select «ninguna»; mapear a `null` en el submit. */
export const PipelineReleaseFormCreateSchema = z.object({
  service_release_id: z.union([z.string().uuid(), z.literal('')]).optional(),
  repositorio_id: z.string().uuid(),
  rama: z.string().min(1).max(255),
  commit_sha: z.string().max(64).nullable().optional(),
  tipo: tipoE,
  resultado: resE,
  herramienta: z.string().max(200).nullable().optional(),
});

export const PipelineReleaseCreateSchema = z.object({
  service_release_id: z.union([z.string().uuid(), z.null()]).optional(),
  repositorio_id: z.string().uuid(),
  rama: z.string().min(1).max(255),
  commit_sha: z.string().max(64).nullable().optional(),
  tipo: tipoE,
  resultado: resE,
  herramienta: z.string().max(200).nullable().optional(),
});

export const PipelineReleaseUpdateSchema = z.object({
  rama: z.string().min(1).max(255).optional(),
  commit_sha: z.string().max(64).nullable().optional(),
  resultado: resE.optional(),
  herramienta: z.string().max(200).nullable().optional(),
});

export type PipelineRelease = z.infer<typeof PipelineReleaseSchema>;
export type PipelineReleaseCreate = z.infer<typeof PipelineReleaseCreateSchema>;
export type PipelineReleaseUpdate = z.infer<typeof PipelineReleaseUpdateSchema>;
