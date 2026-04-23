import { z } from 'zod';

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

export const HallazgoTerceroCreateSchema = z.object({
revision_tercero_id: z.string().uuid(),
vulnerabilidad_id: z.string().uuid().nullable().optional(),
titulo: z.string(),
descripcion: z.string().nullable().optional(),
severidad: z.string(),
cvss_score: z.number().nullable().optional(),
cwe_id: z.string().nullable().optional(),
estado: z.string(),
});

export const HallazgoTerceroUpdateSchema = HallazgoTerceroCreateSchema.partial();

export type HallazgoTercero = z.infer<typeof HallazgoTerceroSchema>;
export type HallazgoTerceroCreate = z.infer<typeof HallazgoTerceroCreateSchema>;
export type HallazgoTerceroUpdate = z.infer<typeof HallazgoTerceroUpdateSchema>;
