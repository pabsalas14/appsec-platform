import { z } from 'zod';

export const ActivoWebSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  nombre: z.string(),
  url: z.string().url(),
  ambiente: z.string(),
  tipo: z.string(),
  celula_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ActivoWebCreateSchema = z.object({
  nombre: z.string().min(1).max(500),
  url: z.string().url('Debe ser una URL http(s) válida'),
  ambiente: z.string().min(1),
  tipo: z.string().min(1),
  celula_id: z.string().uuid(),
});

export const ActivoWebUpdateSchema = ActivoWebCreateSchema.partial();

export type ActivoWeb = z.infer<typeof ActivoWebSchema>;
export type ActivoWebCreate = z.infer<typeof ActivoWebCreateSchema>;
export type ActivoWebUpdate = z.infer<typeof ActivoWebUpdateSchema>;
