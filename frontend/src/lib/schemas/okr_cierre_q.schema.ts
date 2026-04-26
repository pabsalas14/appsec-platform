import { z } from 'zod';

export const OkrCierreQSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
plan_id: z.string().uuid(),
quarter: z.string(),
retroalimentacion_general: z.string(),
cerrado_at: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const OkrCierreQCreateSchema = z.object({
plan_id: z.string().uuid(),
quarter: z.string(),
retroalimentacion_general: z.string(),
cerrado_at: z.string(),
});

export const OkrCierreQUpdateSchema = OkrCierreQCreateSchema.partial();

export type OkrCierreQ = z.infer<typeof OkrCierreQSchema>;
export type OkrCierreQCreate = z.infer<typeof OkrCierreQCreateSchema>;
export type OkrCierreQUpdate = z.infer<typeof OkrCierreQUpdateSchema>;
