import { z } from 'zod';

export const ActividadMensualServiciosReguladosSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  servicio_regulado_registro_id: z.string().uuid(),
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

export const ActividadMensualServiciosReguladosCreateSchema = z.object({
  servicio_regulado_registro_id: z.string().uuid(),
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

export const ActividadMensualServiciosReguladosUpdateSchema =
  ActividadMensualServiciosReguladosCreateSchema.partial();

export type ActividadMensualServiciosRegulados = z.infer<typeof ActividadMensualServiciosReguladosSchema>;
export type ActividadMensualServiciosReguladosCreate = z.infer<
  typeof ActividadMensualServiciosReguladosCreateSchema
>;
export type ActividadMensualServiciosReguladosUpdate = z.infer<
  typeof ActividadMensualServiciosReguladosUpdateSchema
>;
