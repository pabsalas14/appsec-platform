import { z } from 'zod';

export const EjecucionDastSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
programa_dast_id: z.string().uuid(),
fecha_inicio: z.string(),
fecha_fin: z.string().nullable().optional(),
ambiente: z.string(),
herramienta: z.string().nullable().optional(),
resultado: z.string(),
notas: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const EjecucionDastCreateSchema = z.object({
programa_dast_id: z.string().uuid(),
fecha_inicio: z.string(),
fecha_fin: z.string().nullable().optional(),
ambiente: z.string(),
herramienta: z.string().nullable().optional(),
resultado: z.string(),
notas: z.string().nullable().optional(),
});

export const EjecucionDastUpdateSchema = EjecucionDastCreateSchema.partial();

export type EjecucionDast = z.infer<typeof EjecucionDastSchema>;
export type EjecucionDastCreate = z.infer<typeof EjecucionDastCreateSchema>;
export type EjecucionDastUpdate = z.infer<typeof EjecucionDastUpdateSchema>;
