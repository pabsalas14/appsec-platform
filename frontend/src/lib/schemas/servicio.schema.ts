import { z } from 'zod';

export const ServicioSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
nombre: z.string(),
descripcion: z.string().nullable().optional(),
criticidad: z.string(),
tecnologia_stack: z.string().nullable().optional(),
celula_id: z.string().uuid(),
created_at: z.string(),
  updated_at: z.string(),
});

export const ServicioCreateSchema = z.object({
nombre: z.string(),
descripcion: z.string().nullable().optional(),
criticidad: z.string(),
tecnologia_stack: z.string().nullable().optional(),
celula_id: z.string().uuid(),
});

export const ServicioUpdateSchema = ServicioCreateSchema.partial();

export type Servicio = z.infer<typeof ServicioSchema>;
export type ServicioCreate = z.infer<typeof ServicioCreateSchema>;
export type ServicioUpdate = z.infer<typeof ServicioUpdateSchema>;
