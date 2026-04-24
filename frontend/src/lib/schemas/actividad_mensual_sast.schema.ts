import { z } from 'zod';

export const ActividadMensualSastSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
programa_sast_id: z.string().uuid(),
mes: z.number().int(),
ano: z.number().int(),
total_hallazgos: z.number().int().nullable().optional(),
criticos: z.number().int().nullable().optional(),
altos: z.number().int().nullable().optional(),
medios: z.number().int().nullable().optional(),
bajos: z.number().int().nullable().optional(),
score: z.number().nullable().optional(),
notas: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const ActividadMensualSastCreateSchema = z.object({
programa_sast_id: z.string().uuid(),
mes: z.number().int(),
ano: z.number().int(),
total_hallazgos: z.number().int().nullable().optional(),
criticos: z.number().int().nullable().optional(),
altos: z.number().int().nullable().optional(),
medios: z.number().int().nullable().optional(),
bajos: z.number().int().nullable().optional(),
score: z.number().nullable().optional(),
notas: z.string().nullable().optional(),
});

export const ActividadMensualSastUpdateSchema = ActividadMensualSastCreateSchema.partial();

export type ActividadMensualSast = z.infer<typeof ActividadMensualSastSchema>;
export type ActividadMensualSastCreate = z.infer<typeof ActividadMensualSastCreateSchema>;
export type ActividadMensualSastUpdate = z.infer<typeof ActividadMensualSastUpdateSchema>;
