import { z } from 'zod';

export const GerenciaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  nombre: z.string(),
  subdireccion_id: z.string().uuid(),
  descripcion: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const GerenciaCreateSchema = z.object({
  nombre: z.string().min(1),
  subdireccion_id: z.string().uuid(),
  descripcion: z.string().nullable().optional(),
});

export const GerenciaUpdateSchema = GerenciaCreateSchema.partial();

export type Gerencia = z.infer<typeof GerenciaSchema>;
export type GerenciaCreate = z.infer<typeof GerenciaCreateSchema>;
export type GerenciaUpdate = z.infer<typeof GerenciaUpdateSchema>;
