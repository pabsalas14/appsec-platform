import { z } from 'zod';

export const CelulaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre: z.string(),
tipo: z.string(),
descripcion: z.string().nullable().optional(),
subdireccion_id: z.string().uuid(),
created_at: z.string(),
  updated_at: z.string(),
});

export const CelulaCreateSchema = z.object({
nombre: z.string(),
tipo: z.string(),
descripcion: z.string().nullable().optional(),
subdireccion_id: z.string().uuid(),
});

export const CelulaUpdateSchema = CelulaCreateSchema.partial();

export type Celula = z.infer<typeof CelulaSchema>;
export type CelulaCreate = z.infer<typeof CelulaCreateSchema>;
export type CelulaUpdate = z.infer<typeof CelulaUpdateSchema>;
