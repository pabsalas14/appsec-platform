import { z } from 'zod';

export const EvidenciaRegulacionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
registro_id: z.string().uuid(),
control_id: z.string().uuid().nullable().optional(),
descripcion: z.string(),
filename: z.string().nullable().optional(),
sha256: z.string().nullable().optional(),
fecha: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const EvidenciaRegulacionCreateSchema = z.object({
registro_id: z.string().uuid(),
control_id: z.string().uuid().nullable().optional(),
descripcion: z.string(),
filename: z.string().nullable().optional(),
sha256: z.string().nullable().optional(),
fecha: z.string(),
});

export const EvidenciaRegulacionUpdateSchema = EvidenciaRegulacionCreateSchema.partial();

export type EvidenciaRegulacion = z.infer<typeof EvidenciaRegulacionSchema>;
export type EvidenciaRegulacionCreate = z.infer<typeof EvidenciaRegulacionCreateSchema>;
export type EvidenciaRegulacionUpdate = z.infer<typeof EvidenciaRegulacionUpdateSchema>;
