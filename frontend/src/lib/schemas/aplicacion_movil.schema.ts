import { z } from 'zod';

export const AplicacionMovilSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre: z.string(),
plataforma: z.string(),
bundle_id: z.string(),
celula_id: z.string().uuid(),
created_at: z.string(),
  updated_at: z.string(),
});

export const AplicacionMovilCreateSchema = z.object({
nombre: z.string(),
plataforma: z.string(),
bundle_id: z.string(),
celula_id: z.string().uuid(),
});

export const AplicacionMovilUpdateSchema = AplicacionMovilCreateSchema.partial();

export type AplicacionMovil = z.infer<typeof AplicacionMovilSchema>;
export type AplicacionMovilCreate = z.infer<typeof AplicacionMovilCreateSchema>;
export type AplicacionMovilUpdate = z.infer<typeof AplicacionMovilUpdateSchema>;
