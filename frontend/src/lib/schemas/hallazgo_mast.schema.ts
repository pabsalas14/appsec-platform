import { z } from 'zod';

import { SEVERIDADES_HALLAZGO } from '@/lib/hallazgo-constants';

const sev = z.enum(SEVERIDADES_HALLAZGO);

export const HallazgoMASTSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  ejecucion_mast_id: z.string().uuid(),
  vulnerabilidad_id: z.string().uuid().nullable().optional(),
  nombre: z.string(),
  descripcion: z.string().nullable().optional(),
  severidad: z.string(),
  cwe: z.string().nullable().optional(),
  owasp_categoria: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const HallazgoMastFormCreateSchema = z.object({
  ejecucion_mast_id: z.string().uuid(),
  vulnerabilidad_id: z.string().optional(),
  nombre: z.string().min(1).max(500),
  descripcion: z.string().nullable().optional(),
  severidad: sev,
  cwe: z.string().max(32).nullable().optional(),
  owasp_categoria: z.string().max(200).nullable().optional(),
});

export const HallazgoMASTCreateSchema = z.object({
  ejecucion_mast_id: z.string().uuid(),
  vulnerabilidad_id: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.string().uuid().nullish(),
  ),
  nombre: z.string().min(1).max(500),
  descripcion: z.string().nullable().optional(),
  severidad: sev,
  cwe: z.string().max(32).nullable().optional(),
  owasp_categoria: z.string().max(200).nullable().optional(),
});

export const HallazgoMASTUpdateSchema = z.object({
  ejecucion_mast_id: z.string().uuid().optional(),
  vulnerabilidad_id: z.string().uuid().nullish().optional(),
  nombre: z.string().min(1).max(500).optional(),
  descripcion: z.string().nullable().optional(),
  severidad: sev.optional(),
  cwe: z.string().max(32).nullable().optional(),
  owasp_categoria: z.string().max(200).nullable().optional(),
});

export type HallazgoMAST = z.infer<typeof HallazgoMASTSchema>;
export type HallazgoMASTCreate = z.infer<typeof HallazgoMASTCreateSchema>;
export type HallazgoMASTUpdate = z.infer<typeof HallazgoMASTUpdateSchema>;
