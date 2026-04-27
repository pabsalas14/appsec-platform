import { z } from 'zod';

export const ActividadMensualSourceCodeSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  programa_source_code_id: z.string().uuid(),
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

export const ActividadMensualSourceCodeCreateSchema = z.object({
  programa_source_code_id: z.string().uuid(),
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

export const ActividadMensualSourceCodeUpdateSchema = ActividadMensualSourceCodeCreateSchema.partial();

export type ActividadMensualSourceCode = z.infer<typeof ActividadMensualSourceCodeSchema>;
export type ActividadMensualSourceCodeCreate = z.infer<typeof ActividadMensualSourceCodeCreateSchema>;
export type ActividadMensualSourceCodeUpdate = z.infer<typeof ActividadMensualSourceCodeUpdateSchema>;
