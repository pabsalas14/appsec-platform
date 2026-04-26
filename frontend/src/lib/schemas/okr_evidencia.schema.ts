import { z } from 'zod';

export const OkrEvidenciaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
revision_q_id: z.string().uuid(),
attachment_id: z.string().uuid().nullable().optional(),
url_evidencia: z.string().nullable().optional(),
nombre_archivo: z.string().nullable().optional(),
tipo_evidencia: z.string(),
created_at: z.string(),
  updated_at: z.string(),
});

export const OkrEvidenciaCreateSchema = z.object({
revision_q_id: z.string().uuid(),
attachment_id: z.string().uuid().nullable().optional(),
url_evidencia: z.string().nullable().optional(),
nombre_archivo: z.string().nullable().optional(),
tipo_evidencia: z.string(),
});

export const OkrEvidenciaUpdateSchema = OkrEvidenciaCreateSchema.partial();

export type OkrEvidencia = z.infer<typeof OkrEvidenciaSchema>;
export type OkrEvidenciaCreate = z.infer<typeof OkrEvidenciaCreateSchema>;
export type OkrEvidenciaUpdate = z.infer<typeof OkrEvidenciaUpdateSchema>;
