import { z } from 'zod';

export const EvidenciaRemediacionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
vulnerabilidad_id: z.string().uuid(),
descripcion: z.string(),
sha256: z.string().nullable().optional(),
filename: z.string().nullable().optional(),
content_type: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const EvidenciaRemediacionCreateSchema = z.object({
vulnerabilidad_id: z.string().uuid(),
descripcion: z.string(),
sha256: z.string().nullable().optional(),
filename: z.string().nullable().optional(),
content_type: z.string().nullable().optional(),
});

export const EvidenciaRemediacionUpdateSchema = EvidenciaRemediacionCreateSchema.partial();

export type EvidenciaRemediacion = z.infer<typeof EvidenciaRemediacionSchema>;
export type EvidenciaRemediacionCreate = z.infer<typeof EvidenciaRemediacionCreateSchema>;
export type EvidenciaRemediacionUpdate = z.infer<typeof EvidenciaRemediacionUpdateSchema>;
