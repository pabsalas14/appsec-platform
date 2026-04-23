import { z } from 'zod';

export const TipoPruebaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre: z.string(),
categoria: z.string(),
descripcion: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const TipoPruebaCreateSchema = z.object({
nombre: z.string(),
categoria: z.string(),
descripcion: z.string().nullable().optional(),
});

export const TipoPruebaUpdateSchema = TipoPruebaCreateSchema.partial();

export type TipoPrueba = z.infer<typeof TipoPruebaSchema>;
export type TipoPruebaCreate = z.infer<typeof TipoPruebaCreateSchema>;
export type TipoPruebaUpdate = z.infer<typeof TipoPruebaUpdateSchema>;
