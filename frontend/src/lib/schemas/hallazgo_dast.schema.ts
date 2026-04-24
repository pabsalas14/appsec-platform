import { z } from 'zod';

import { ESTADOS_HALLAZGO_SAST_DAST, SEVERIDADES_HALLAZGO } from '@/lib/hallazgo-constants';

const sev = z.enum(SEVERIDADES_HALLAZGO);
const est = z.enum(ESTADOS_HALLAZGO_SAST_DAST);

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

export const HallazgoDastFormCreateSchema = z.object({
  ejecucion_dast_id: z.string().uuid(),
  vulnerabilidad_id: z.string().optional(),
  titulo: z.string().min(1).max(255),
  descripcion: z.string().nullable().optional(),
  severidad: sev,
  url: z.string().max(500).optional(),
  parametro: z.string().max(255).nullable().optional(),
  estado: est,
});

export const HallazgoDastCreateSchema = z.object({
  ejecucion_dast_id: z.string().uuid(),
  vulnerabilidad_id: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.string().uuid().nullish(),
  ),
  titulo: z.string().min(1).max(255),
  descripcion: z.string().nullable().optional(),
  severidad: sev,
  url: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().max(500).nullish()),
  parametro: z.string().max(255).nullable().optional(),
  estado: est,
});

export const HallazgoDastUpdateSchema = z.object({
  vulnerabilidad_id: z.string().uuid().nullish().optional(),
  titulo: z.string().min(1).max(255).optional(),
  descripcion: z.string().nullable().optional(),
  severidad: sev.optional(),
  url: z.string().max(500).nullable().optional(),
  parametro: z.string().max(255).nullable().optional(),
  estado: est.optional(),
});

export type HallazgoDast = z.infer<typeof HallazgoDastSchema>;
export type HallazgoDastCreate = z.infer<typeof HallazgoDastCreateSchema>;
export type HallazgoDastUpdate = z.infer<typeof HallazgoDastUpdateSchema>;
