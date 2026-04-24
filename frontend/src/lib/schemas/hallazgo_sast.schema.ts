import { z } from 'zod';

import { ESTADOS_HALLAZGO_SAST_DAST, SEVERIDADES_HALLAZGO } from '@/lib/hallazgo-constants';

const sev = z.enum(SEVERIDADES_HALLAZGO);
const est = z.enum(ESTADOS_HALLAZGO_SAST_DAST);

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

export const HallazgoSastFormCreateSchema = z.object({
  actividad_sast_id: z.string().uuid(),
  vulnerabilidad_id: z.string().optional(),
  titulo: z.string().min(1).max(255),
  descripcion: z.string().nullable().optional(),
  severidad: sev,
  herramienta: z.string().max(100).nullable().optional(),
  regla: z.string().max(255).nullable().optional(),
  archivo: z.string().max(500).nullable().optional(),
  linea: z.string().optional(),
  estado: est,
});

export const HallazgoSastCreateSchema = z.object({
  actividad_sast_id: z.string().uuid(),
  vulnerabilidad_id: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.string().uuid().nullish(),
  ),
  titulo: z.string().min(1).max(255),
  descripcion: z.string().nullable().optional(),
  severidad: sev,
  herramienta: z.string().max(100).nullable().optional(),
  regla: z.string().max(255).nullable().optional(),
  archivo: z.string().max(500).nullable().optional(),
  linea: z.number().int().min(1).nullish().optional(),
  estado: est,
});

export const HallazgoSastUpdateSchema = z.object({
  vulnerabilidad_id: z.string().uuid().nullish().optional(),
  titulo: z.string().min(1).max(255).optional(),
  descripcion: z.string().nullable().optional(),
  severidad: sev.optional(),
  herramienta: z.string().max(100).nullable().optional(),
  regla: z.string().max(255).nullable().optional(),
  archivo: z.string().max(500).nullable().optional(),
  linea: z.number().int().min(1).nullish().optional(),
  estado: est.optional(),
});

export type HallazgoSast = z.infer<typeof HallazgoSastSchema>;
export type HallazgoSastCreate = z.infer<typeof HallazgoSastCreateSchema>;
export type HallazgoSastUpdate = z.infer<typeof HallazgoSastUpdateSchema>;
