import { z } from 'zod';

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

export const PipelineReleaseCreateSchema = z.object({
service_release_id: z.string().uuid().nullable().optional(),
repositorio_id: z.string().uuid(),
rama: z.string(),
commit_sha: z.string().nullable().optional(),
tipo: z.string(),
resultado: z.string(),
herramienta: z.string().nullable().optional(),
});

export const PipelineReleaseUpdateSchema = PipelineReleaseCreateSchema.partial();

export type PipelineRelease = z.infer<typeof PipelineReleaseSchema>;
export type PipelineReleaseCreate = z.infer<typeof PipelineReleaseCreateSchema>;
export type PipelineReleaseUpdate = z.infer<typeof PipelineReleaseUpdateSchema>;
