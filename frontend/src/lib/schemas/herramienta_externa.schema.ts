import { z } from 'zod';

export const HerramientaExternaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre: z.string(),
tipo: z.string(),
url_base: z.string().nullable().optional(),
api_token: z.string().nullable().optional(),
created_at: z.string(),
  updated_at: z.string(),
});

export const HerramientaExternaCreateSchema = z.object({
nombre: z.string(),
tipo: z.string(),
url_base: z.string().nullable().optional(),
api_token: z.string().nullable().optional(),
});

export const HerramientaExternaUpdateSchema = HerramientaExternaCreateSchema.partial();

export type HerramientaExterna = z.infer<typeof HerramientaExternaSchema>;
export type HerramientaExternaCreate = z.infer<typeof HerramientaExternaCreateSchema>;
export type HerramientaExternaUpdate = z.infer<typeof HerramientaExternaUpdateSchema>;
