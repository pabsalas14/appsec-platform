import { z } from 'zod';

export const ActividadMensualDastSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  programa_dast_id: z.string().uuid(),
  mes: z.number().int(),
  ano: z.number().int(),
  total_hallazgos: z.number().int().nullable().optional(),
  criticos: z.number().int().nullable().optional(),
  altos: z.number().int().nullable().optional(),
  medios: z.number().int().nullable().optional(),
  bajos: z.number().int().nullable().optional(),
  sub_estado: z.string().max(100).nullable().optional(),
  score: z.number().nullable().optional(),
  notas: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ActividadMensualDastCreateSchema = z.object({
  programa_dast_id: z.string().uuid(),
  mes: z.number().int(),
  ano: z.number().int(),
  total_hallazgos: z.number().int().nullable().optional(),
  criticos: z.number().int().nullable().optional(),
  altos: z.number().int().nullable().optional(),
  medios: z.number().int().nullable().optional(),
  bajos: z.number().int().nullable().optional(),
  sub_estado: z.string().max(100).nullable().optional(),
  notas: z.string().nullable().optional(),
});

export const ActividadMensualDastUpdateSchema = ActividadMensualDastCreateSchema.partial();

export type ActividadMensualDast = z.infer<typeof ActividadMensualDastSchema>;
export type ActividadMensualDastCreate = z.infer<typeof ActividadMensualDastCreateSchema>;
export type ActividadMensualDastUpdate = z.infer<typeof ActividadMensualDastUpdateSchema>;
