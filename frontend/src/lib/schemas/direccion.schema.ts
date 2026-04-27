import { z } from 'zod';

export const DireccionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  nombre: z.string(),
  codigo: z.string(),
  descripcion: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const DireccionCreateSchema = z.object({
  nombre: z.string(),
  codigo: z.string(),
  descripcion: z.string().nullable().optional(),
});

export const DireccionUpdateSchema = DireccionCreateSchema.partial();

export type Direccion = z.infer<typeof DireccionSchema>;
export type DireccionCreate = z.infer<typeof DireccionCreateSchema>;
export type DireccionUpdate = z.infer<typeof DireccionUpdateSchema>;
