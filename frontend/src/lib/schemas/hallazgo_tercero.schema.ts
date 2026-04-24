import { z } from 'zod';

import { ESTADOS_HALLAZGO_PIPELINE, SEVERIDADES_HALLAZGO } from '@/lib/hallazgo-constants';

const sev = z.enum(SEVERIDADES_HALLAZGO);
const est = z.enum(ESTADOS_HALLAZGO_PIPELINE);

export const HallazgoTerceroSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  revision_tercero_id: z.string().uuid(),
  vulnerabilidad_id: z.string().uuid().nullable().optional(),
  titulo: z.string(),
  descripcion: z.string().nullable().optional(),
  severidad: z.string(),
  cvss_score: z.number().nullable().optional(),
  cwe_id: z.string().nullable().optional(),
  estado: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const HallazgoTerceroFormCreateSchema = z.object({
  revision_tercero_id: z.string().uuid(),
  vulnerabilidad_id: z.string().optional(),
  titulo: z.string().min(1).max(500),
  descripcion: z.string().nullable().optional(),
  severidad: sev,
  cvss_score: z.string().optional(),
  cwe_id: z.string().max(32).nullable().optional(),
  estado: est,
});

export const HallazgoTerceroCreateSchema = z.object({
  revision_tercero_id: z.string().uuid(),
  vulnerabilidad_id: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.string().uuid().nullish(),
  ),
  titulo: z.string().min(1).max(500),
  descripcion: z.string().nullable().optional(),
  severidad: sev,
  cvss_score: z.coerce.number().min(0).max(10).optional().nullable(),
  cwe_id: z.string().max(32).nullable().optional(),
  estado: est,
});

export const HallazgoTerceroUpdateSchema = z.object({
  vulnerabilidad_id: z.string().uuid().nullish().optional(),
  titulo: z.string().min(1).max(500).optional(),
  descripcion: z.string().nullable().optional(),
  severidad: sev.optional(),
  cvss_score: z.coerce.number().min(0).max(10).optional().nullable(),
  cwe_id: z.string().max(32).nullable().optional(),
  estado: est.optional(),
});

export type HallazgoTercero = z.infer<typeof HallazgoTerceroSchema>;
export type HallazgoTerceroCreate = z.infer<typeof HallazgoTerceroCreateSchema>;
export type HallazgoTerceroUpdate = z.infer<typeof HallazgoTerceroUpdateSchema>;
