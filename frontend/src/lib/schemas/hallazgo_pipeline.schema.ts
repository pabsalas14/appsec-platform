import { z } from 'zod';

import { ESTADOS_HALLAZGO_PIPELINE, SEVERIDADES_HALLAZGO } from '@/lib/hallazgo-constants';

const sev = z.enum(SEVERIDADES_HALLAZGO);
const est = z.enum(ESTADOS_HALLAZGO_PIPELINE);

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

/** Formularios: línea y vínculo a vuln vacíos en UI como string. */
export const HallazgoPipelineFormCreateSchema = z.object({
  pipeline_release_id: z.string().uuid(),
  vulnerabilidad_id: z.string().optional(),
  titulo: z.string().min(1).max(500),
  descripcion: z.string().nullable().optional(),
  severidad: sev,
  archivo: z.string().max(500).nullable().optional(),
  linea: z.string().optional(),
  regla: z.string().max(500).nullable().optional(),
  estado: est,
});

export const HallazgoPipelineCreateSchema = z.object({
  pipeline_release_id: z.string().uuid(),
  vulnerabilidad_id: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.string().uuid().nullish(),
  ),
  titulo: z.string().min(1).max(500),
  descripcion: z.string().nullable().optional(),
  severidad: sev,
  archivo: z.string().max(500).nullable().optional(),
  linea: z.number().int().min(1).nullish().optional(),
  regla: z.string().max(500).nullable().optional(),
  estado: est,
});

export const HallazgoPipelineUpdateSchema = z.object({
  vulnerabilidad_id: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.string().uuid().nullish().optional(),
  ),
  titulo: z.string().min(1).max(500).optional(),
  descripcion: z.string().nullable().optional(),
  severidad: sev.optional(),
  archivo: z.string().max(500).nullable().optional(),
  linea: z.number().int().min(1).nullish().optional(),
  regla: z.string().max(500).nullable().optional(),
  estado: est.optional(),
});

export type HallazgoPipeline = z.infer<typeof HallazgoPipelineSchema>;
export type HallazgoPipelineCreate = z.infer<typeof HallazgoPipelineCreateSchema>;
export type HallazgoPipelineUpdate = z.infer<typeof HallazgoPipelineUpdateSchema>;
