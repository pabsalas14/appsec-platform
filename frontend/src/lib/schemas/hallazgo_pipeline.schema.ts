import { z } from 'zod';

export const HallazgoPipelineSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
pipeline_release_id: z.string().uuid(),
vulnerabilidad_id: z.string().uuid().nullable().optional(),
titulo: z.string(),
descripcion: z.string().nullable().optional(),
severidad: z.string(),
archivo: z.string().nullable().optional(),
linea: z.number().int().nullable().optional(),
regla: z.string().nullable().optional(),
estado: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const HallazgoPipelineCreateSchema = z.object({
pipeline_release_id: z.string().uuid(),
vulnerabilidad_id: z.string().uuid().nullable().optional(),
titulo: z.string(),
descripcion: z.string().nullable().optional(),
severidad: z.string(),
archivo: z.string().nullable().optional(),
linea: z.number().int().nullable().optional(),
regla: z.string().nullable().optional(),
estado: z.string(),
});

export const HallazgoPipelineUpdateSchema = HallazgoPipelineCreateSchema.partial();

export type HallazgoPipeline = z.infer<typeof HallazgoPipelineSchema>;
export type HallazgoPipelineCreate = z.infer<typeof HallazgoPipelineCreateSchema>;
export type HallazgoPipelineUpdate = z.infer<typeof HallazgoPipelineUpdateSchema>;
