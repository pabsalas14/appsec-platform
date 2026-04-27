import { z } from 'zod';

export const OkrCategoriaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre: z.string(),
descripcion: z.string().nullable().optional(),
activo: z.boolean(),
created_at: z.string(),
  updated_at: z.string(),
});

export const OkrCategoriaCreateSchema = z.object({
nombre: z.string(),
descripcion: z.string().nullable().optional(),
activo: z.boolean(),
});

export const OkrCategoriaUpdateSchema = OkrCategoriaCreateSchema.partial();

export type OkrCategoria = z.infer<typeof OkrCategoriaSchema>;
export type OkrCategoriaCreate = z.infer<typeof OkrCategoriaCreateSchema>;
export type OkrCategoriaUpdate = z.infer<typeof OkrCategoriaUpdateSchema>;
