import { z } from 'zod';

export const HallazgoDastSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
ejecucion_dast_id: z.string().uuid(),
vulnerabilidad_id: z.string().uuid().nullable().optional(),
titulo: z.string(),
descripcion: z.string().nullable().optional(),
severidad: z.string(),
url: z.string().nullable().optional(),
parametro: z.string().nullable().optional(),
estado: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const HallazgoDastCreateSchema = z.object({
ejecucion_dast_id: z.string().uuid(),
vulnerabilidad_id: z.string().uuid().nullable().optional(),
titulo: z.string(),
descripcion: z.string().nullable().optional(),
severidad: z.string(),
url: z.string().nullable().optional(),
parametro: z.string().nullable().optional(),
estado: z.string(),
});

export const HallazgoDastUpdateSchema = HallazgoDastCreateSchema.partial();

export type HallazgoDast = z.infer<typeof HallazgoDastSchema>;
export type HallazgoDastCreate = z.infer<typeof HallazgoDastCreateSchema>;
export type HallazgoDastUpdate = z.infer<typeof HallazgoDastUpdateSchema>;
