import { z } from 'zod';

export const EvidenciaAuditoriaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  nombre_archivo: z.string(),
  tipo_evidencia: z.string(),
  url_archivo: z.string(),
  hash_sha256: z.string(),
  auditoria_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const EvidenciaAuditoriaCreateSchema = z.object({
  nombre_archivo: z.string().min(1).max(255),
  tipo_evidencia: z.string().min(1).max(100),
  url_archivo: z.string().min(1).max(512),
  hash_sha256: z.string().min(1).max(64),
  auditoria_id: z.string().uuid(),
});

export const EvidenciaAuditoriaUpdateSchema = z.object({
  nombre_archivo: z.string().min(1).max(255).optional(),
  tipo_evidencia: z.string().min(1).max(100).optional(),
  url_archivo: z.string().min(1).max(512).optional(),
  hash_sha256: z.string().min(1).max(64).optional(),
});

export type EvidenciaAuditoria = z.infer<typeof EvidenciaAuditoriaSchema>;
export type EvidenciaAuditoriaCreate = z.infer<typeof EvidenciaAuditoriaCreateSchema>;
export type EvidenciaAuditoriaUpdate = z.infer<typeof EvidenciaAuditoriaUpdateSchema>;
