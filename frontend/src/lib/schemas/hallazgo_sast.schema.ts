import { z } from 'zod';

export const HallazgoSastSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
actividad_sast_id: z.string().uuid(),
vulnerabilidad_id: z.string().uuid().nullable().optional(),
titulo: z.string(),
descripcion: z.string().nullable().optional(),
severidad: z.string(),
herramienta: z.string().nullable().optional(),
regla: z.string().nullable().optional(),
archivo: z.string().nullable().optional(),
linea: z.number().int().nullable().optional(),
estado: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const HallazgoSastCreateSchema = z.object({
actividad_sast_id: z.string().uuid(),
vulnerabilidad_id: z.string().uuid().nullable().optional(),
titulo: z.string(),
descripcion: z.string().nullable().optional(),
severidad: z.string(),
herramienta: z.string().nullable().optional(),
regla: z.string().nullable().optional(),
archivo: z.string().nullable().optional(),
linea: z.number().int().nullable().optional(),
estado: z.string(),
});

export const HallazgoSastUpdateSchema = HallazgoSastCreateSchema.partial();

export type HallazgoSast = z.infer<typeof HallazgoSastSchema>;
export type HallazgoSastCreate = z.infer<typeof HallazgoSastCreateSchema>;
export type HallazgoSastUpdate = z.infer<typeof HallazgoSastUpdateSchema>;
