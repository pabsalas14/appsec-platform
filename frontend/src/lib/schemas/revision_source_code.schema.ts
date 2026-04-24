import { z } from 'zod';

export const RevisionSourceCodeSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
programa_sc_id: z.string().uuid(),
control_sc_id: z.string().uuid(),
fecha_revision: z.string(),
resultado: z.string(),
evidencia_filename: z.string().nullable().optional(),
evidencia_sha256: z.string().nullable().optional(),
notas: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const RevisionSourceCodeCreateSchema = z.object({
programa_sc_id: z.string().uuid(),
control_sc_id: z.string().uuid(),
fecha_revision: z.string(),
resultado: z.string(),
evidencia_filename: z.string().nullable().optional(),
evidencia_sha256: z.string().nullable().optional(),
notas: z.string().nullable().optional(),
});

export const RevisionSourceCodeUpdateSchema = RevisionSourceCodeCreateSchema.partial();

export type RevisionSourceCode = z.infer<typeof RevisionSourceCodeSchema>;
export type RevisionSourceCodeCreate = z.infer<typeof RevisionSourceCodeCreateSchema>;
export type RevisionSourceCodeUpdate = z.infer<typeof RevisionSourceCodeUpdateSchema>;
